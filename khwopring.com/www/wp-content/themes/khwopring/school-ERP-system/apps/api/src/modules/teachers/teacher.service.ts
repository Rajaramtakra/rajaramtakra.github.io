import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import type {
  AddTeacherExperienceInput,
  AddTeacherQualificationInput,
  CreateTeacherInput,
  PaginationQuery,
  TeacherSearchInput,
  UpdateTeacherInput,
  UpdateTeacherStatusInput,
} from "@erp/shared";
import type { EmploymentStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../lib/errors";
import { buildPaginationArgs, toPaginatedResult } from "../../lib/pagination";

const TEACHER_INCLUDE = {
  qualifications: { orderBy: { yearCompleted: "desc" as const } },
  experiences: { orderBy: { fromDate: "desc" as const } },
  user: { select: { email: true, isActive: true, lastLoginAt: true } },
} as const;

async function findOrThrow(schoolId: string, id: string) {
  const teacher = await prisma.teacher.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: TEACHER_INCLUDE,
  });
  if (!teacher) throw new NotFoundError("Teacher not found");
  return teacher;
}

async function generateEmployeeCode(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.teacher.count({ where: { schoolId, createdAt: { gte: new Date(`${year}-01-01`) } } });
    const candidate = `TCH-${year}-${String(count + 1 + attempt).padStart(4, "0")}`;
    const exists = await prisma.teacher.findUnique({ where: { employeeCode: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Failed to generate a unique employee code");
}

function generateTemporaryPassword(): string {
  return `Erp@${randomBytes(5).toString("hex")}`;
}

export async function getTeacher(schoolId: string, id: string) {
  return findOrThrow(schoolId, id);
}

export async function setPhoto(schoolId: string, id: string, photoUrl: string) {
  await findOrThrow(schoolId, id);
  return prisma.teacher.update({ where: { id }, data: { photoUrl }, include: TEACHER_INCLUDE });
}

export async function searchTeachers(schoolId: string, pagination: PaginationQuery, filters: TeacherSearchInput) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    deletedAt: null,
    ...(filters.employmentStatus ? { employmentStatus: filters.employmentStatus as EmploymentStatus } : {}),
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
    prisma.teacher.findMany({
      where,
      include: { user: { select: { email: true, isActive: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.teacher.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function createTeacher(schoolId: string, input: CreateTeacherInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) throw new BadRequestError("A user with this email already exists");

  const teacherRole = await prisma.role.findFirst({ where: { schoolId, name: "TEACHER" } });
  if (!teacherRole) throw new BadRequestError("TEACHER role is not seeded for this school");

  const employeeCode = await generateEmployeeCode(schoolId);
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await argon2.hash(temporaryPassword);

  const teacher = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        schoolId,
        email: input.email,
        passwordHash,
        fullName: `${input.firstName} ${input.lastName}`,
        phone: input.phone,
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: teacherRole.id } });
    return tx.teacher.create({
      data: {
        schoolId,
        userId: user.id,
        employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        dateOfJoining: input.dateOfJoining,
        specialization: input.specialization,
        address: input.address,
      },
      include: TEACHER_INCLUDE,
    });
  });

  return { teacher, temporaryPassword };
}

export async function updateTeacher(schoolId: string, id: string, input: UpdateTeacherInput) {
  const teacher = await findOrThrow(schoolId, id);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.teacher.update({
      where: { id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        specialization: input.specialization,
        address: input.address,
      },
      include: TEACHER_INCLUDE,
    });
    if (input.email || input.firstName || input.lastName || input.phone) {
      await tx.user.update({
        where: { id: teacher.userId },
        data: {
          email: input.email,
          phone: input.phone,
          fullName: `${input.firstName ?? teacher.firstName} ${input.lastName ?? teacher.lastName}`,
        },
      });
    }
    return updated;
  });
}

export async function updateEmploymentStatus(schoolId: string, id: string, input: UpdateTeacherStatusInput) {
  const teacher = await findOrThrow(schoolId, id);
  const updated = await prisma.teacher.update({
    where: { id },
    data: { employmentStatus: input.employmentStatus },
    include: TEACHER_INCLUDE,
  });
  if (input.employmentStatus === "TERMINATED" || input.employmentStatus === "RESIGNED") {
    await prisma.user.update({ where: { id: teacher.userId }, data: { isActive: false } });
  }
  return updated;
}

export async function addQualification(schoolId: string, teacherId: string, input: AddTeacherQualificationInput) {
  await findOrThrow(schoolId, teacherId);
  return prisma.teacherQualification.create({ data: { teacherId, ...input } });
}

export async function addExperience(schoolId: string, teacherId: string, input: AddTeacherExperienceInput) {
  await findOrThrow(schoolId, teacherId);
  return prisma.teacherExperience.create({ data: { teacherId, ...input } });
}

export async function getTeacherByUserId(schoolId: string, userId: string) {
  const teacher = await prisma.teacher.findFirst({ where: { userId, schoolId, deletedAt: null } });
  if (!teacher) throw new NotFoundError("Teacher profile not found for this user");
  return teacher;
}

export async function getMyProfile(schoolId: string, userId: string) {
  const teacher = await prisma.teacher.findFirst({
    where: { userId, schoolId, deletedAt: null },
    include: {
      ...TEACHER_INCLUDE,
      subjectAssignments: { include: { subject: true, section: { include: { class: true } } } },
    },
  });
  if (!teacher) throw new NotFoundError("Teacher profile not found for this user");
  return teacher;
}
