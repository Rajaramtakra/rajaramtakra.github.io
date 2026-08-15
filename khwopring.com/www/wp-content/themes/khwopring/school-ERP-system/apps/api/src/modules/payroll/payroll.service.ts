import type { AddSalaryComponentInput, CreatePayrollRunInput, CreateSalaryStructureInput, Permission } from "@erp/shared";
import type { PayrollStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors";
import { storage } from "../../lib/storage";
import { renderPayslipPdf } from "./payslip.pdf";

const PERSON_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  employeeCode: true,
} as const;

const SALARY_STRUCTURE_INCLUDE = {
  teacher: { select: PERSON_SELECT },
  staff: { select: PERSON_SELECT },
  allowances: true,
  deductions: true,
} as const;

const PAYROLL_RUN_INCLUDE = {
  payslips: {
    include: {
      teacher: { select: PERSON_SELECT },
      staff: { select: PERSON_SELECT },
    },
  },
} as const;

const PAYSLIP_INCLUDE = {
  payrollRun: true,
  teacher: { select: { ...PERSON_SELECT, salaryStructure: { include: { allowances: true, deductions: true } } } },
  staff: { select: { ...PERSON_SELECT, salaryStructure: { include: { allowances: true, deductions: true } } } },
} as const;

/** DRAFT -> PROCESSED -> PAID, forward-only, mirroring admission.service.ts's ALLOWED_TRANSITIONS pattern. */
const ALLOWED_TRANSITIONS: Record<PayrollStatus, PayrollStatus[]> = {
  DRAFT: ["PROCESSED"],
  PROCESSED: ["PAID"],
  PAID: [],
};

export function assertPayrollTransition(current: PayrollStatus, next: PayrollStatus) {
  if (!ALLOWED_TRANSITIONS[current].includes(next)) {
    throw new ConflictError(`Cannot move payroll run from ${current} to ${next}`);
  }
}

/** gross = basic + allowances; net = gross - deductions. */
export function computeNetSalary(structure: {
  basicSalary: unknown;
  allowances: { amount: unknown }[];
  deductions: { amount: unknown }[];
}) {
  const basicSalary = Number(structure.basicSalary);
  const allowancesTotal = structure.allowances.reduce((sum, a) => sum + Number(a.amount), 0);
  const deductionsTotal = structure.deductions.reduce((sum, d) => sum + Number(d.amount), 0);
  const grossSalary = basicSalary + allowancesTotal;
  const netSalary = grossSalary - deductionsTotal;
  return { grossSalary, totalDeductions: deductionsTotal, netSalary };
}

// ---------------------------------------------------------------------------
// Salary structures
// ---------------------------------------------------------------------------

export async function createSalaryStructure(schoolId: string, input: CreateSalaryStructureInput) {
  if (input.teacherId) {
    const teacher = await prisma.teacher.findFirst({ where: { id: input.teacherId, schoolId, deletedAt: null } });
    if (!teacher) throw new NotFoundError("Teacher not found");
    const existing = await prisma.salaryStructure.findUnique({ where: { teacherId: input.teacherId } });
    if (existing) throw new ConflictError("This teacher already has a salary structure");
  } else if (input.staffId) {
    const staff = await prisma.staffMember.findFirst({ where: { id: input.staffId, schoolId, deletedAt: null } });
    if (!staff) throw new NotFoundError("Staff member not found");
    const existing = await prisma.salaryStructure.findUnique({ where: { staffId: input.staffId } });
    if (existing) throw new ConflictError("This staff member already has a salary structure");
  }

  return prisma.salaryStructure.create({
    data: {
      schoolId,
      teacherId: input.teacherId,
      staffId: input.staffId,
      basicSalary: input.basicSalary,
      allowances: { create: input.allowances },
      deductions: { create: input.deductions },
    },
    include: SALARY_STRUCTURE_INCLUDE,
  });
}

export async function listSalaryStructures(schoolId: string) {
  return prisma.salaryStructure.findMany({
    where: { schoolId },
    include: SALARY_STRUCTURE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function getSalaryStructure(schoolId: string, id: string) {
  const structure = await prisma.salaryStructure.findFirst({ where: { id, schoolId }, include: SALARY_STRUCTURE_INCLUDE });
  if (!structure) throw new NotFoundError("Salary structure not found");
  return structure;
}

export async function addSalaryComponent(
  schoolId: string,
  structureId: string,
  kind: "allowance" | "deduction",
  input: AddSalaryComponentInput
) {
  const structure = await prisma.salaryStructure.findFirst({ where: { id: structureId, schoolId } });
  if (!structure) throw new NotFoundError("Salary structure not found");

  if (kind === "allowance") {
    await prisma.allowance.create({ data: { salaryStructureId: structureId, name: input.name, amount: input.amount } });
  } else {
    await prisma.deduction.create({ data: { salaryStructureId: structureId, name: input.name, amount: input.amount } });
  }

  return prisma.salaryStructure.findUniqueOrThrow({ where: { id: structureId }, include: SALARY_STRUCTURE_INCLUDE });
}

// ---------------------------------------------------------------------------
// Payroll runs
// ---------------------------------------------------------------------------

export async function listPayrollRuns(schoolId: string) {
  return prisma.payrollRun.findMany({
    where: { schoolId },
    include: { _count: { select: { payslips: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

async function findRunOrThrow(schoolId: string, id: string) {
  const run = await prisma.payrollRun.findFirst({ where: { id, schoolId }, include: PAYROLL_RUN_INCLUDE });
  if (!run) throw new NotFoundError("Payroll run not found");
  return run;
}

export async function getPayrollRun(schoolId: string, id: string) {
  return findRunOrThrow(schoolId, id);
}

/**
 * Creates the DRAFT payroll run for [schoolId, month, year] if it doesn't exist yet, or regenerates its
 * payslips if it is still DRAFT (e.g. salary structures changed after the first generation). Blocks
 * regeneration once the run has moved past DRAFT, and always wipes any existing payslips for the run
 * before recreating them so payslips are never duplicated.
 */
export async function createOrRegeneratePayrollRun(schoolId: string, input: CreatePayrollRunInput) {
  return prisma.$transaction(async (tx) => {
    let run = await tx.payrollRun.findUnique({
      where: { schoolId_month_year: { schoolId, month: input.month, year: input.year } },
    });

    if (run && run.status !== "DRAFT") {
      throw new ConflictError(
        `Payroll run for ${input.month}/${input.year} is already ${run.status} and cannot be regenerated`
      );
    }

    if (!run) {
      run = await tx.payrollRun.create({ data: { schoolId, month: input.month, year: input.year, status: "DRAFT" } });
    } else {
      // Guard against double-creating payslips for the same run: wipe before regenerating.
      await tx.payslip.deleteMany({ where: { payrollRunId: run.id } });
    }

    const [teachers, staff] = await Promise.all([
      tx.teacher.findMany({
        where: { schoolId, deletedAt: null, employmentStatus: "ACTIVE", salaryStructure: { isNot: null } },
        include: { salaryStructure: { include: { allowances: true, deductions: true } } },
      }),
      tx.staffMember.findMany({
        where: { schoolId, deletedAt: null, employmentStatus: "ACTIVE", salaryStructure: { isNot: null } },
        include: { salaryStructure: { include: { allowances: true, deductions: true } } },
      }),
    ]);

    const payslipRows = [
      ...teachers.map((t) => ({ teacherId: t.id as string | null, staffId: null as string | null, structure: t.salaryStructure! })),
      ...staff.map((s) => ({ teacherId: null as string | null, staffId: s.id as string | null, structure: s.salaryStructure! })),
    ].map(({ teacherId, staffId, structure }) => {
      const { grossSalary, totalDeductions, netSalary } = computeNetSalary(structure);
      return { payrollRunId: run!.id, teacherId, staffId, grossSalary, totalDeductions, netSalary };
    });

    if (payslipRows.length > 0) {
      await tx.payslip.createMany({ data: payslipRows });
    }

    return tx.payrollRun.findUniqueOrThrow({ where: { id: run.id }, include: PAYROLL_RUN_INCLUDE });
  });
}

export async function processRun(schoolId: string, id: string, processedById: string) {
  const run = await findRunOrThrow(schoolId, id);
  assertPayrollTransition(run.status, "PROCESSED");
  if (run.payslips.length === 0) {
    throw new BadRequestError("Cannot process a payroll run with no payslips generated");
  }
  return prisma.payrollRun.update({
    where: { id },
    data: { status: "PROCESSED", processedById, processedAt: new Date() },
    include: PAYROLL_RUN_INCLUDE,
  });
}

export async function markRunPaid(schoolId: string, id: string) {
  const run = await findRunOrThrow(schoolId, id);
  assertPayrollTransition(run.status, "PAID");

  await prisma.payrollRun.update({ where: { id }, data: { status: "PAID" } });

  // Generate payslip PDFs for any payslip that doesn't already have one, at mark-paid time.
  for (const payslip of run.payslips) {
    if (!payslip.filePath) {
      await generateAndSavePayslipPdf(schoolId, payslip.id);
    }
  }

  return findRunOrThrow(schoolId, id);
}

// ---------------------------------------------------------------------------
// Payslips
// ---------------------------------------------------------------------------

async function getOwnTeacherId(schoolId: string, userId: string) {
  const teacher = await prisma.teacher.findFirst({ where: { userId, schoolId, deletedAt: null } });
  return teacher?.id;
}

async function getOwnStaffId(schoolId: string, userId: string) {
  const staff = await prisma.staffMember.findFirst({ where: { userId, schoolId, deletedAt: null } });
  return staff?.id;
}

async function generateAndSavePayslipPdf(schoolId: string, payslipId: string) {
  const payslip = await prisma.payslip.findFirst({
    where: { id: payslipId, payrollRun: { schoolId } },
    include: PAYSLIP_INCLUDE,
  });
  if (!payslip) throw new NotFoundError("Payslip not found");

  const buffer = await renderPayslipPdf(payslip);
  const { filePath } = await storage.save(buffer, `payslip-${payslip.id}.pdf`, "payslips");

  return prisma.payslip.update({ where: { id: payslip.id }, data: { filePath }, include: PAYSLIP_INCLUDE });
}

export async function listMyPayslips(schoolId: string, userId: string) {
  const teacherId = await getOwnTeacherId(schoolId, userId);
  const staffId = teacherId ? undefined : await getOwnStaffId(schoolId, userId);
  if (!teacherId && !staffId) throw new NotFoundError("No teacher or staff profile found for this user");

  return prisma.payslip.findMany({
    where: teacherId ? { teacherId } : { staffId },
    include: PAYSLIP_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPayslipForCaller(
  schoolId: string,
  requester: { userId: string; permissions: Permission[] },
  payslipId: string
) {
  const payslip = await prisma.payslip.findFirst({
    where: { id: payslipId, payrollRun: { schoolId } },
    include: PAYSLIP_INCLUDE,
  });
  if (!payslip) throw new NotFoundError("Payslip not found");

  if (!requester.permissions.includes("payroll:manage")) {
    const teacherId = await getOwnTeacherId(schoolId, requester.userId);
    const staffId = teacherId ? undefined : await getOwnStaffId(schoolId, requester.userId);
    const isOwner = (teacherId && payslip.teacherId === teacherId) || (staffId && payslip.staffId === staffId);
    if (!isOwner) throw new ForbiddenError("You may only view your own payslips");
  }

  if (!payslip.filePath) {
    return generateAndSavePayslipPdf(schoolId, payslip.id);
  }
  return payslip;
}
