import type {
  AddGuardianInput,
  AlumniConvertInput,
  EmergencyContactInput,
  PaginationQuery,
  Permission,
  PromoteStudentsInput,
  ReinstateStudentInput,
  RusticateStudentInput,
  StudentSearchInput,
  SuspendStudentInput,
  TransferCertificateInput,
  UpdateStudentProfileInput,
} from "@erp/shared";
import type { StudentStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors";
import { buildPaginationArgs, toPaginatedResult } from "../../lib/pagination";
import { getOwnStudentId } from "../../lib/students";

function generateTemporaryPassword(): string {
  return `Erp@${randomBytes(5).toString("hex")}`;
}

const STUDENT_INCLUDE = {
  section: { include: { class: true } },
  academicSession: true,
  guardians: { include: { guardian: true } },
  emergencyContacts: true,
} as const;

async function findOrThrow(schoolId: string, id: string) {
  const student = await prisma.student.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: STUDENT_INCLUDE,
  });
  if (!student) throw new NotFoundError("Student not found");
  return student;
}

export async function getStudent(
  schoolId: string,
  id: string,
  requester: { userId: string; permissions: Permission[] }
) {
  if (!requester.permissions.includes("student:read")) {
    const ownStudentId = await getOwnStudentId(schoolId, requester.userId);
    if (ownStudentId !== id) throw new ForbiddenError("You may only view your own student record");
  }
  return findOrThrow(schoolId, id);
}

export async function setPhoto(schoolId: string, id: string, photoUrl: string) {
  await findOrThrow(schoolId, id);
  return prisma.student.update({ where: { id }, data: { photoUrl }, include: STUDENT_INCLUDE });
}

export async function searchStudents(schoolId: string, pagination: PaginationQuery, filters: StudentSearchInput) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    deletedAt: null,
    ...(filters.classId ? { section: { classId: filters.classId } } : {}),
    ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
    ...(filters.status ? { status: filters.status as StudentStatus } : {}),
    ...(pagination.search
      ? {
          OR: [
            { firstName: { contains: pagination.search, mode: "insensitive" as const } },
            { lastName: { contains: pagination.search, mode: "insensitive" as const } },
            { registrationNumber: { contains: pagination.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { section: { include: { class: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.student.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function updateProfile(schoolId: string, id: string, input: UpdateStudentProfileInput) {
  await findOrThrow(schoolId, id);
  return prisma.student.update({ where: { id }, data: input, include: STUDENT_INCLUDE });
}

export async function addGuardian(schoolId: string, studentId: string, input: AddGuardianInput) {
  await findOrThrow(schoolId, studentId);

  let guardianId = input.linkToExistingGuardianId;
  if (!guardianId) {
    const guardian = await prisma.guardian.create({
      data: {
        schoolId,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        occupation: input.occupation,
      },
    });
    guardianId = guardian.id;
  }

  if (input.isPrimary) {
    await prisma.studentGuardian.updateMany({ where: { studentId }, data: { isPrimary: false } });
  }

  return prisma.studentGuardian.create({
    data: { studentId, guardianId, relation: input.relation, isPrimary: input.isPrimary },
    include: { guardian: true },
  });
}

export async function addEmergencyContact(schoolId: string, studentId: string, input: EmergencyContactInput) {
  await findOrThrow(schoolId, studentId);
  return prisma.emergencyContact.create({ data: { studentId, ...input } });
}

export async function promoteStudents(schoolId: string, promotedById: string, input: PromoteStudentsInput) {
  const targetSection = await prisma.section.findFirst({ where: { id: input.toSectionId, schoolId, deletedAt: null } });
  if (!targetSection) throw new NotFoundError("Target section not found");

  const students = await prisma.student.findMany({
    where: { id: { in: input.studentIds }, schoolId, deletedAt: null },
  });
  if (students.length !== input.studentIds.length) {
    throw new BadRequestError("One or more students were not found in this school");
  }

  return prisma.$transaction(
    students.map((student) =>
      prisma.student.update({
        where: { id: student.id },
        data: {
          sectionId: input.toSectionId,
          academicSessionId: input.toAcademicSessionId,
          promotionHistory: {
            create: {
              fromSectionId: student.sectionId,
              toSectionId: input.toSectionId,
              fromAcademicSessionId: student.academicSessionId,
              toAcademicSessionId: input.toAcademicSessionId,
              promotedById,
            },
          },
        },
      })
    )
  );
}

function assertActive(status: StudentStatus) {
  if (status !== "ACTIVE") {
    throw new ConflictError(`Student is currently ${status}, this action requires an ACTIVE student`);
  }
}

export async function suspendStudent(schoolId: string, id: string, input: SuspendStudentInput) {
  const student = await findOrThrow(schoolId, id);
  assertActive(student.status);
  return prisma.student.update({
    where: { id },
    data: { status: "SUSPENDED", suspensionReason: input.reason, suspendedUntil: input.suspendedUntil },
  });
}

export async function reinstateStudent(schoolId: string, id: string, _input: ReinstateStudentInput) {
  const student = await findOrThrow(schoolId, id);
  if (student.status !== "SUSPENDED" && student.status !== "RUSTICATED") {
    throw new ConflictError("Only suspended or rusticated students can be reinstated");
  }
  return prisma.student.update({
    where: { id },
    data: { status: "ACTIVE", suspensionReason: null, suspendedUntil: null },
  });
}

export async function rusticateStudent(schoolId: string, id: string, input: RusticateStudentInput) {
  const student = await findOrThrow(schoolId, id);
  assertActive(student.status);
  return prisma.student.update({
    where: { id },
    data: { status: "RUSTICATED", suspensionReason: input.reason, suspendedUntil: input.rusticatedUntil },
  });
}

export async function issueTransferCertificate(schoolId: string, id: string, input: TransferCertificateInput) {
  const student = await findOrThrow(schoolId, id);
  assertActive(student.status);
  return prisma.student.update({
    where: { id },
    data: {
      status: "TRANSFERRED",
      transferredAt: input.issueDate ?? new Date(),
      suspensionReason: input.reason,
      tcIssuedAt: new Date(),
    },
  });
}

export async function convertToAlumni(schoolId: string, id: string, input: AlumniConvertInput) {
  const student = await findOrThrow(schoolId, id);
  if (student.status !== "ACTIVE") {
    throw new ConflictError("Only active students can be converted to alumni");
  }
  return prisma.student.update({
    where: { id },
    data: { status: "ALUMNI", alumniGraduationYear: input.graduationYear },
  });
}

export async function enableStudentPortalAccess(schoolId: string, id: string) {
  const student = await findOrThrow(schoolId, id);
  if (student.userId) throw new ConflictError("Portal access is already enabled for this student");
  if (!student.email) throw new BadRequestError("Student must have an email on file to enable portal access");

  const existingUser = await prisma.user.findUnique({ where: { email: student.email } });
  if (existingUser) throw new BadRequestError("A user with this email already exists");

  const studentRole = await prisma.role.findFirst({ where: { schoolId, name: "STUDENT" } });
  if (!studentRole) throw new BadRequestError("STUDENT role is not seeded for this school");

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await argon2.hash(temporaryPassword);

  const updatedStudent = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        schoolId,
        email: student.email!,
        passwordHash,
        fullName: `${student.firstName} ${student.lastName}`,
        phone: student.phone,
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: studentRole.id } });
    return tx.student.update({ where: { id }, data: { userId: user.id }, include: STUDENT_INCLUDE });
  });

  return { student: updatedStudent, temporaryPassword };
}
