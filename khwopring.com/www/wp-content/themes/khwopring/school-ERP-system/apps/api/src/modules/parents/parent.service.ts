import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors";
import * as attendanceService from "../attendance/attendance.service";
import * as homeworkService from "../homework/homework.service";
import * as timetableService from "../timetable/timetable.service";

function generateTemporaryPassword(): string {
  return `Erp@${randomBytes(5).toString("hex")}`;
}

async function getGuardianByUserId(schoolId: string, userId: string) {
  const guardian = await prisma.guardian.findFirst({ where: { userId, schoolId, deletedAt: null } });
  if (!guardian) throw new NotFoundError("Guardian profile not found for this user");
  return guardian;
}

async function getOwnChild(schoolId: string, userId: string, studentId: string) {
  const guardian = await getGuardianByUserId(schoolId, userId);
  const link = await prisma.studentGuardian.findFirst({
    where: { guardianId: guardian.id, studentId },
    include: {
      student: { include: { section: { include: { class: true } }, academicSession: true } },
    },
  });
  if (!link) throw new ForbiddenError("This student is not linked to your guardian account");
  return link.student;
}

export async function listMyChildren(schoolId: string, userId: string) {
  const guardian = await getGuardianByUserId(schoolId, userId);
  const links = await prisma.studentGuardian.findMany({
    where: { guardianId: guardian.id, student: { deletedAt: null } },
    include: {
      student: {
        include: { section: { include: { class: true } }, academicSession: true },
      },
    },
  });
  return links.map((link) => ({ ...link.student, relation: link.relation, isPrimary: link.isPrimary }));
}

export async function getChildAttendance(
  schoolId: string,
  userId: string,
  studentId: string,
  dateRange: { fromDate?: Date; toDate?: Date }
) {
  const student = await getOwnChild(schoolId, userId, studentId);
  return attendanceService.listStudentAttendance(schoolId, { studentId: student.id, ...dateRange });
}

export async function getChildHomework(schoolId: string, userId: string, studentId: string) {
  const student = await getOwnChild(schoolId, userId, studentId);
  return homeworkService.listHomework(schoolId, { sectionId: student.sectionId });
}

export async function getChildTimetable(schoolId: string, userId: string, studentId: string) {
  const student = await getOwnChild(schoolId, userId, studentId);
  return timetableService.listBySection(schoolId, student.sectionId);
}

export async function enableGuardianPortalAccess(schoolId: string, guardianId: string) {
  const guardian = await prisma.guardian.findFirst({ where: { id: guardianId, schoolId, deletedAt: null } });
  if (!guardian) throw new NotFoundError("Guardian not found");
  if (guardian.userId) throw new ConflictError("Portal access is already enabled for this guardian");
  if (!guardian.email) throw new BadRequestError("Guardian must have an email on file to enable portal access");

  const existingUser = await prisma.user.findUnique({ where: { email: guardian.email } });
  if (existingUser) throw new BadRequestError("A user with this email already exists");

  const parentRole = await prisma.role.findFirst({ where: { schoolId, name: "PARENT" } });
  if (!parentRole) throw new BadRequestError("PARENT role is not seeded for this school");

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await argon2.hash(temporaryPassword);

  const updatedGuardian = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { schoolId, email: guardian.email!, passwordHash, fullName: guardian.fullName, phone: guardian.phone },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: parentRole.id } });
    return tx.guardian.update({ where: { id: guardianId }, data: { userId: user.id } });
  });

  return { guardian: updatedGuardian, temporaryPassword };
}
