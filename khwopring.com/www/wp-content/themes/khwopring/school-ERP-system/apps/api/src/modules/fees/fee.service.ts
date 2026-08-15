import type {
  CreateDiscountInput,
  CreateFeeCategoryInput,
  CreateFeeStructureInput,
  CreateFineInput,
  CreateScholarshipInput,
} from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";

// --- Fee Categories ---

export function createFeeCategory(schoolId: string, input: CreateFeeCategoryInput) {
  return prisma.feeCategory.create({ data: { schoolId, ...input } });
}

export function listFeeCategories(schoolId: string) {
  return prisma.feeCategory.findMany({ where: { schoolId, deletedAt: null }, orderBy: { name: "asc" } });
}

// --- Fee Structures ---

export function createFeeStructure(schoolId: string, input: CreateFeeStructureInput) {
  return prisma.feeStructure.create({
    data: { schoolId, ...input },
    include: { class: true, feeCategory: true, academicSession: true },
  });
}

export function listFeeStructures(schoolId: string, filters: { classId?: string; academicSessionId?: string }) {
  return prisma.feeStructure.findMany({
    where: {
      schoolId,
      deletedAt: null,
      ...(filters.classId ? { classId: filters.classId } : {}),
      ...(filters.academicSessionId ? { academicSessionId: filters.academicSessionId } : {}),
    },
    include: { class: true, feeCategory: true, academicSession: true },
    orderBy: { createdAt: "desc" },
  });
}

// --- Discounts ---

export async function createDiscount(schoolId: string, approvedById: string, input: CreateDiscountInput) {
  const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId, deletedAt: null } });
  if (!student) throw new NotFoundError("Student not found");

  return prisma.discount.create({
    data: { schoolId, approvedById, ...input },
    include: { feeStructure: { include: { feeCategory: true } } },
  });
}

export function listDiscounts(schoolId: string, studentId?: string) {
  return prisma.discount.findMany({
    where: { schoolId, ...(studentId ? { studentId } : {}) },
    include: { feeStructure: { include: { feeCategory: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// --- Scholarships ---

export async function createScholarship(schoolId: string, approvedById: string, input: CreateScholarshipInput) {
  const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId, deletedAt: null } });
  if (!student) throw new NotFoundError("Student not found");

  return prisma.scholarship.create({ data: { schoolId, approvedById, ...input } });
}

export function listScholarships(schoolId: string, studentId?: string) {
  return prisma.scholarship.findMany({
    where: { schoolId, ...(studentId ? { studentId } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

// --- Fines ---

export async function createFine(schoolId: string, input: CreateFineInput) {
  const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId, deletedAt: null } });
  if (!student) throw new NotFoundError("Student not found");

  return prisma.fine.create({ data: { schoolId, ...input } });
}

export function listFines(schoolId: string, studentId?: string) {
  return prisma.fine.findMany({
    where: { schoolId, ...(studentId ? { studentId } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

async function findFineOrThrow(schoolId: string, id: string) {
  const fine = await prisma.fine.findFirst({ where: { id, schoolId } });
  if (!fine) throw new NotFoundError("Fine not found");
  return fine;
}

export async function waiveFine(schoolId: string, id: string) {
  const fine = await findFineOrThrow(schoolId, id);
  if (fine.status !== "PENDING") throw new ConflictError(`Fine is already ${fine.status}`);
  return prisma.fine.update({ where: { id }, data: { status: "WAIVED" } });
}

export async function markFinePaid(schoolId: string, id: string) {
  const fine = await findFineOrThrow(schoolId, id);
  if (fine.status !== "PENDING") throw new ConflictError(`Fine is already ${fine.status}`);
  return prisma.fine.update({ where: { id }, data: { status: "PAID" } });
}
