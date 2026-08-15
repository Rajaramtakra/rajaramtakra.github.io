import type {
  MarkStaffAttendanceInput,
  MarkStudentAttendanceInput,
  Permission,
  StaffAttendanceQuery,
  StudentAttendanceQuery,
} from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { getOwnStudentId } from "../../lib/students";

const STUDENT_ATTENDANCE_INCLUDE = {
  student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
  section: { include: { class: true } },
} as const;

async function getOwnTeacherId(schoolId: string, userId: string) {
  const teacher = await prisma.teacher.findFirst({ where: { userId, schoolId, deletedAt: null } });
  return teacher?.id;
}

async function getOwnStaffId(schoolId: string, userId: string) {
  const staff = await prisma.staffMember.findFirst({ where: { userId, schoolId, deletedAt: null } });
  return staff?.id;
}

export async function markStudentAttendance(schoolId: string, markedById: string, input: MarkStudentAttendanceInput) {
  const rows = await prisma.$transaction(
    input.entries.map((entry) =>
      prisma.studentAttendance.upsert({
        where: { studentId_date: { studentId: entry.studentId, date: input.date } },
        create: {
          schoolId,
          studentId: entry.studentId,
          sectionId: input.sectionId,
          date: input.date,
          status: entry.status,
          remarks: entry.remarks,
          markedById,
        },
        update: { status: entry.status, remarks: entry.remarks, markedById },
      })
    )
  );
  return rows;
}

export function listStudentAttendance(schoolId: string, filters: StudentAttendanceQuery) {
  return prisma.studentAttendance.findMany({
    where: {
      schoolId,
      ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(filters.date ? { date: filters.date } : {}),
      ...(filters.fromDate || filters.toDate
        ? { date: { gte: filters.fromDate, lte: filters.toDate } }
        : {}),
    },
    include: STUDENT_ATTENDANCE_INCLUDE,
    orderBy: { date: "desc" },
  });
}

export async function listStudentAttendanceForCaller(
  schoolId: string,
  requester: { userId: string; permissions: Permission[] },
  filters: StudentAttendanceQuery
) {
  const canReadAll = requester.permissions.includes("attendance_student:read");
  const studentId = canReadAll ? filters.studentId : await getOwnStudentId(schoolId, requester.userId);
  return listStudentAttendance(schoolId, { ...filters, studentId });
}

export async function markStaffAttendance(schoolId: string, markedById: string, input: MarkStaffAttendanceInput) {
  const existing = await prisma.staffAttendance.findFirst({
    where: {
      schoolId,
      date: input.date,
      ...(input.teacherId ? { teacherId: input.teacherId } : { staffId: input.staffId }),
    },
  });

  if (existing) {
    return prisma.staffAttendance.update({
      where: { id: existing.id },
      data: { status: input.status, checkInAt: input.checkInAt, checkOutAt: input.checkOutAt, markedById },
    });
  }

  return prisma.staffAttendance.create({
    data: {
      schoolId,
      teacherId: input.teacherId,
      staffId: input.staffId,
      date: input.date,
      status: input.status,
      checkInAt: input.checkInAt,
      checkOutAt: input.checkOutAt,
      markedById,
    },
  });
}

export async function listStaffAttendanceForCaller(
  schoolId: string,
  requester: { userId: string; permissions: Permission[] },
  filters: StaffAttendanceQuery
) {
  const canReadAll = requester.permissions.includes("attendance_staff:read");
  let teacherId = filters.teacherId;
  let staffId = filters.staffId;

  if (!canReadAll) {
    teacherId = await getOwnTeacherId(schoolId, requester.userId);
    staffId = teacherId ? undefined : await getOwnStaffId(schoolId, requester.userId);
    if (!teacherId && !staffId) throw new NotFoundError("No teacher or staff profile found for this user");
  }

  return prisma.staffAttendance.findMany({
    where: {
      schoolId,
      ...(teacherId ? { teacherId } : {}),
      ...(staffId ? { staffId } : {}),
      ...(filters.date ? { date: filters.date } : {}),
      ...(filters.fromDate || filters.toDate
        ? { date: { gte: filters.fromDate, lte: filters.toDate } }
        : {}),
    },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      staff: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { date: "desc" },
  });
}
