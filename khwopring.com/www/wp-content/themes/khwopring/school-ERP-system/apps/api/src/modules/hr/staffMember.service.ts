import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import type {
  CreateStaffMemberInput,
  PaginationQuery,
  PromoteStaffInput,
  StaffSearchInput,
  UpdateStaffMemberInput,
  UpdateStaffStatusInput,
} from "@erp/shared";
import type { EmploymentStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../lib/errors";
import { buildPaginationArgs, toPaginatedResult } from "../../lib/pagination";
import { generateStaffEmployeeCode } from "./staffMember.numbering";

const STAFF_INCLUDE = {
  user: { select: { email: true, isActive: true, lastLoginAt: true } },
} as const;

function generateTemporaryPassword(): string {
  return `Erp@${randomBytes(5).toString("hex")}`;
}

async function findOrThrow(schoolId: string, id: string) {
  const staff = await prisma.staffMember.findFirst({ where: { id, schoolId, deletedAt: null }, include: STAFF_INCLUDE });
  if (!staff) throw new NotFoundError("Staff member not found");
  return staff;
}

export async function getStaffMember(schoolId: string, id: string) {
  return findOrThrow(schoolId, id);
}

export async function setPhoto(schoolId: string, id: string, photoUrl: string) {
  await findOrThrow(schoolId, id);
  return prisma.staffMember.update({ where: { id }, data: { photoUrl }, include: STAFF_INCLUDE });
}

export async function getMyStaffProfile(schoolId: string, userId: string) {
  const staff = await prisma.staffMember.findFirst({ where: { userId, schoolId, deletedAt: null }, include: STAFF_INCLUDE });
  if (!staff) throw new NotFoundError("Staff profile not found for this user");
  return staff;
}

export async function searchStaffMembers(schoolId: string, pagination: PaginationQuery, filters: StaffSearchInput) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    deletedAt: null,
    ...(filters.employmentStatus ? { employmentStatus: filters.employmentStatus as EmploymentStatus } : {}),
    ...(filters.department ? { department: { contains: filters.department, mode: "insensitive" as const } } : {}),
    ...(pagination.search
      ? {
          OR: [
            { firstName: { contains: pagination.search, mode: "insensitive" as const } },
            { lastName: { contains: pagination.search, mode: "insensitive" as const } },
            { employeeCode: { contains: pagination.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.staffMember.findMany({
      where,
      include: { user: { select: { email: true, isActive: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.staffMember.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function createStaffMember(schoolId: string, input: CreateStaffMemberInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) throw new BadRequestError("A user with this email already exists");

  const role = await prisma.role.findFirst({ where: { schoolId, name: input.role } });
  if (!role) throw new BadRequestError(`${input.role} role is not seeded for this school`);

  const employeeCode = await generateStaffEmployeeCode(schoolId);
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await argon2.hash(temporaryPassword);

  const staffMember = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        schoolId,
        email: input.email,
        passwordHash,
        fullName: `${input.firstName} ${input.lastName}`,
        phone: input.phone,
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    return tx.staffMember.create({
      data: {
        schoolId,
        userId: user.id,
        employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        department: input.department,
        designation: input.designation,
        dateOfJoining: input.dateOfJoining,
      },
      include: STAFF_INCLUDE,
    });
  });

  return { staffMember, temporaryPassword };
}

export async function updateStaffMember(schoolId: string, id: string, input: UpdateStaffMemberInput) {
  const staff = await findOrThrow(schoolId, id);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.staffMember.update({
      where: { id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        department: input.department,
        designation: input.designation,
      },
      include: STAFF_INCLUDE,
    });
    if (input.email || input.firstName || input.lastName || input.phone) {
      await tx.user.update({
        where: { id: staff.userId },
        data: {
          email: input.email,
          phone: input.phone,
          fullName: `${input.firstName ?? staff.firstName} ${input.lastName ?? staff.lastName}`,
        },
      });
    }
    return updated;
  });
}

export async function updateEmploymentStatus(schoolId: string, id: string, input: UpdateStaffStatusInput) {
  const staff = await findOrThrow(schoolId, id);
  const updated = await prisma.staffMember.update({
    where: { id },
    data: { employmentStatus: input.employmentStatus },
    include: STAFF_INCLUDE,
  });
  if (input.employmentStatus === "TERMINATED" || input.employmentStatus === "RESIGNED") {
    await prisma.user.update({ where: { id: staff.userId }, data: { isActive: false } });
  }
  return updated;
}

export async function promoteStaffMember(schoolId: string, id: string, promotedById: string, input: PromoteStaffInput) {
  const staff = await findOrThrow(schoolId, id);
  return prisma.staffMember.update({
    where: { id },
    data: {
      designation: input.toDesignation,
      department: input.toDepartment,
      promotionHistory: {
        create: {
          fromDesignation: staff.designation,
          toDesignation: input.toDesignation,
          fromDepartment: staff.department,
          toDepartment: input.toDepartment,
          remarks: input.remarks,
          promotedById,
        },
      },
    },
    include: STAFF_INCLUDE,
  });
}

export function listPromotionHistory(schoolId: string, id: string) {
  return prisma.staffPromotionHistory.findMany({
    where: { staff: { id, schoolId } },
    orderBy: { promotedAt: "desc" },
  });
}
