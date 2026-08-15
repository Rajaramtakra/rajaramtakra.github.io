import { prisma } from "../../lib/prisma";
import type { AdmissionStatus, AttendanceStatus } from "@prisma/client";

const ADMISSION_STATUSES: AdmissionStatus[] = ["DRAFT", "SUBMITTED", "REVIEW", "APPROVED", "REJECTED", "ENROLLED"];
const ATTENDANCE_STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "EXCUSED"];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getSummary(schoolId: string) {
  const [
    totalStudents,
    activeStudents,
    suspendedStudents,
    alumniStudents,
    totalTeachers,
    totalClasses,
    totalSections,
    admissionCounts,
    recentAdmissions,
    recentStudents,
    attendanceTodayCounts,
    homeworkDueThisWeek,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId, deletedAt: null } }),
    prisma.student.count({ where: { schoolId, deletedAt: null, status: "ACTIVE" } }),
    prisma.student.count({ where: { schoolId, deletedAt: null, status: "SUSPENDED" } }),
    prisma.student.count({ where: { schoolId, deletedAt: null, status: "ALUMNI" } }),
    prisma.teacher.count({ where: { schoolId, deletedAt: null } }),
    prisma.class.count({ where: { schoolId, deletedAt: null } }),
    prisma.section.count({ where: { schoolId, deletedAt: null } }),
    Promise.all(
      ADMISSION_STATUSES.map(async (status) => ({
        status,
        count: await prisma.admissionApplication.count({ where: { schoolId, status, deletedAt: null } }),
      }))
    ),
    prisma.admissionApplication.findMany({
      where: { schoolId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        applicationNumber: true,
        studentFirstName: true,
        studentLastName: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.student.findMany({
      where: { schoolId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        registrationNumber: true,
        firstName: true,
        lastName: true,
        admissionDate: true,
        section: { select: { name: true, class: { select: { name: true } } } },
      },
    }),
    Promise.all(
      ATTENDANCE_STATUSES.map(async (status) => ({
        status,
        count: await prisma.studentAttendance.count({
          where: { schoolId, status, date: { gte: startOfToday(), lte: endOfToday() } },
        }),
      }))
    ),
    prisma.homework.count({
      where: {
        schoolId,
        deletedAt: null,
        dueDate: { gte: startOfToday(), lte: new Date(startOfToday().getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return {
    totals: {
      students: totalStudents,
      activeStudents,
      suspendedStudents,
      alumniStudents,
      teachers: totalTeachers,
      classes: totalClasses,
      sections: totalSections,
    },
    admissionsByStatus: admissionCounts,
    recentAdmissions,
    recentStudents,
    attendanceToday: {
      byStatus: attendanceTodayCounts,
      totalMarked: attendanceTodayCounts.reduce((sum, s) => sum + s.count, 0),
    },
    homeworkDueThisWeek,
  };
}
