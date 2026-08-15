import type {
  BookSearchInput,
  CreateBookInput,
  IssueBookInput,
  Permission,
  PaginationQuery,
  ReserveBookInput,
  ReturnBookInput,
  UpdateBookInput,
} from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors";
import { buildPaginationArgs, toPaginatedResult } from "../../lib/pagination";
import { env } from "../../config/env";
import { generateLibraryCardPdf } from "./libraryCard.pdf";

/**
 * Simplification: there is no school-configurable "loan period" settings model yet,
 * so the default due date window is hardcoded here.
 */
const DEFAULT_LOAN_PERIOD_DAYS = 14;

/**
 * Simplification: there is no fine-rate configuration model yet, so the per-day
 * overdue fine is hardcoded here (in the school's base currency unit).
 */
const FINE_PER_DAY = 1;

const COPY_CODE_PREFIX_LEN = 6;

const ISSUE_INCLUDE = {
  bookCopy: { include: { book: true } },
  student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
  teacher: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
} as const;

const RESERVATION_INCLUDE = {
  book: true,
  student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
} as const;

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function buildCopyCode(bookId: string, sequence: number) {
  return `${bookId.slice(0, COPY_CODE_PREFIX_LEN).toUpperCase()}-${String(sequence).padStart(3, "0")}`;
}

async function findBookOrThrow(schoolId: string, id: string) {
  const book = await prisma.book.findFirst({ where: { id, schoolId, deletedAt: null }, include: { copies: true } });
  if (!book) throw new NotFoundError("Book not found");
  return book;
}

export async function createBook(schoolId: string, input: CreateBookInput) {
  return prisma.$transaction(async (tx) => {
    const book = await tx.book.create({
      data: {
        schoolId,
        isbn: input.isbn,
        title: input.title,
        author: input.author,
        publisher: input.publisher,
        category: input.category,
        totalCopies: input.totalCopies,
        vendorId: input.vendorId,
        shelfLocation: input.shelfLocation,
      },
    });

    const copies = [];
    for (let seq = 1; seq <= input.totalCopies; seq++) {
      copies.push(
        await tx.bookCopy.create({
          data: { bookId: book.id, copyCode: buildCopyCode(book.id, seq), status: "AVAILABLE" },
        })
      );
    }

    return { ...book, copies };
  });
}

export async function listBooks(schoolId: string, pagination: PaginationQuery, filters: BookSearchInput) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    deletedAt: null,
    ...(filters.category ? { category: filters.category } : {}),
    ...(pagination.search
      ? {
          OR: [
            { title: { contains: pagination.search, mode: "insensitive" as const } },
            { author: { contains: pagination.search, mode: "insensitive" as const } },
            { isbn: { contains: pagination.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.book.findMany({
      where,
      include: { copies: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.book.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function getBook(schoolId: string, id: string) {
  const book = await findBookOrThrow(schoolId, id);
  const issues = await prisma.bookIssue.findMany({
    where: { schoolId, bookCopy: { bookId: id } },
    include: ISSUE_INCLUDE,
    orderBy: { issuedAt: "desc" },
  });
  return { ...book, issues };
}

export async function updateBook(schoolId: string, id: string, input: UpdateBookInput) {
  await findBookOrThrow(schoolId, id);
  return prisma.book.update({ where: { id }, data: input });
}

export async function setBookCover(schoolId: string, id: string, coverImagePath: string) {
  await findBookOrThrow(schoolId, id);
  return prisma.book.update({ where: { id }, data: { coverImagePath } });
}

export async function issueBook(schoolId: string, input: IssueBookInput) {
  const book = await prisma.book.findFirst({ where: { id: input.bookId, schoolId, deletedAt: null } });
  if (!book) throw new NotFoundError("Book not found");

  const availableCopy = await prisma.bookCopy.findFirst({ where: { bookId: input.bookId, status: "AVAILABLE" } });
  if (!availableCopy) {
    throw new ConflictError(
      "No copies of this book are currently available. Call the reserve-book endpoint to join the waiting list instead."
    );
  }

  const dueDate = input.dueDate ?? addDays(new Date(), DEFAULT_LOAN_PERIOD_DAYS);

  return prisma.$transaction(async (tx) => {
    await tx.bookCopy.update({ where: { id: availableCopy.id }, data: { status: "ISSUED" } });
    return tx.bookIssue.create({
      data: {
        schoolId,
        bookCopyId: availableCopy.id,
        studentId: input.studentId,
        teacherId: input.teacherId,
        dueDate,
      },
      include: ISSUE_INCLUDE,
    });
  });
}

export async function returnBook(schoolId: string, input: ReturnBookInput) {
  const issue = await prisma.bookIssue.findFirst({ where: { id: input.bookIssueId, schoolId } });
  if (!issue) throw new NotFoundError("Book issue not found");
  if (issue.status === "RETURNED") throw new ConflictError("This book issue has already been returned");

  const now = new Date();
  const daysLate = Math.max(0, Math.ceil((now.getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  const fineAmount = daysLate * FINE_PER_DAY;

  return prisma.$transaction(async (tx) => {
    await tx.bookCopy.update({ where: { id: issue.bookCopyId }, data: { status: "AVAILABLE" } });
    return tx.bookIssue.update({
      where: { id: issue.id },
      data: { status: "RETURNED", returnedAt: now, fineAmount },
      include: ISSUE_INCLUDE,
    });
  });
}

export async function markIssueLost(schoolId: string, bookIssueId: string) {
  const issue = await prisma.bookIssue.findFirst({ where: { id: bookIssueId, schoolId } });
  if (!issue) throw new NotFoundError("Book issue not found");
  if (issue.status === "RETURNED" || issue.status === "LOST") {
    throw new ConflictError("Only active issues can be marked lost");
  }

  return prisma.$transaction(async (tx) => {
    await tx.bookCopy.update({ where: { id: issue.bookCopyId }, data: { status: "LOST" } });
    return tx.bookIssue.update({ where: { id: issue.id }, data: { status: "LOST" }, include: ISSUE_INCLUDE });
  });
}

export async function listActiveIssues(schoolId: string) {
  return prisma.bookIssue.findMany({
    where: { schoolId, status: { in: ["ISSUED", "OVERDUE"] } },
    include: ISSUE_INCLUDE,
    orderBy: { dueDate: "asc" },
  });
}

export async function listIssuesForCaller(
  schoolId: string,
  requester: { userId: string; permissions: Permission[] },
  filters: { studentId?: string; teacherId?: string }
) {
  const canReadAll = requester.permissions.includes("library:read");
  let studentId = filters.studentId;
  let teacherId = filters.teacherId;

  if (!canReadAll) {
    const student = await prisma.student.findFirst({
      where: { userId: requester.userId, schoolId, deletedAt: null },
    });
    if (student) {
      studentId = student.id;
      teacherId = undefined;
    } else {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: requester.userId, schoolId, deletedAt: null },
      });
      teacherId = teacher?.id;
      studentId = undefined;
    }
    if (!studentId && !teacherId) {
      throw new NotFoundError("No student or teacher profile found for this user");
    }
  }

  return prisma.bookIssue.findMany({
    where: {
      schoolId,
      ...(studentId ? { studentId } : {}),
      ...(teacherId ? { teacherId } : {}),
    },
    include: ISSUE_INCLUDE,
    orderBy: { issuedAt: "desc" },
  });
}

export async function reserveBook(schoolId: string, input: ReserveBookInput) {
  const book = await prisma.book.findFirst({ where: { id: input.bookId, schoolId, deletedAt: null } });
  if (!book) throw new NotFoundError("Book not found");

  const availableCopy = await prisma.bookCopy.findFirst({ where: { bookId: input.bookId, status: "AVAILABLE" } });
  if (availableCopy) {
    throw new BadRequestError("A copy of this book is currently available; issue it directly instead of reserving");
  }

  return prisma.bookReservation.create({
    data: { schoolId, bookId: input.bookId, studentId: input.studentId },
    include: RESERVATION_INCLUDE,
  });
}

export async function listReservations(schoolId: string, filters: { bookId?: string }) {
  return prisma.bookReservation.findMany({
    where: { schoolId, status: "PENDING", ...(filters.bookId ? { bookId: filters.bookId } : {}) },
    include: RESERVATION_INCLUDE,
    orderBy: { reservedAt: "asc" },
  });
}

/**
 * Simplification: returns never auto-issue to the front of the reservation queue.
 * A librarian must call this endpoint to manually issue the book to a specific
 * pending reservation once a copy becomes available.
 */
export async function issueToReservation(schoolId: string, reservationId: string) {
  const reservation = await prisma.bookReservation.findFirst({
    where: { id: reservationId, schoolId, status: "PENDING" },
  });
  if (!reservation) throw new NotFoundError("Pending reservation not found");

  const issue = await issueBook(schoolId, { bookId: reservation.bookId, studentId: reservation.studentId });
  await prisma.bookReservation.update({ where: { id: reservation.id }, data: { status: "FULFILLED" } });
  return issue;
}

/** Generated on demand each call, mirroring the student ID card's live-QR pattern — no stored artifact. */
export async function generateLibraryCardPdfForStudent(schoolId: string, studentId: string): Promise<Buffer> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
    include: { section: { include: { class: true } }, school: true },
  });
  if (!student) throw new NotFoundError("Student not found");
  if (!student.idCardQrCode) throw new ForbiddenError("This student does not have a QR code issued yet");

  return generateLibraryCardPdf({
    schoolName: student.school.name,
    studentName: `${student.firstName} ${student.lastName}`,
    registrationNumber: student.registrationNumber,
    className: student.section.class.name,
    sectionName: student.section.name,
    verifyUrl: `${env.CORS_ORIGIN}/verify/${student.idCardQrCode}`,
  });
}
