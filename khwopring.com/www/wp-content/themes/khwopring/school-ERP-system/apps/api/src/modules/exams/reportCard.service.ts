import type { Permission, PublishReportCardsInput } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { storage } from "../../lib/storage";
import { generateReportCardPdf, type ReportCardSubjectRow } from "./reportCard.pdf";

const REPORT_CARD_INCLUDE = {
  student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
  exam: true,
} as const;

interface StudentTotal {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  gpa: number | null;
  rank: number;
  subjectMarks: ReportCardSubjectRow[];
}

/**
 * Aggregates every Mark under the exam's schedules for `sectionId`, one row per active student:
 * totalMarks/totalMaxMarks summed across subjects, percentage from those sums, gpa averaged from each
 * subject's GradeScale lookup, and rank computed in-service (sorted desc by totalMarks, standard
 * competition ranking so ties share a rank) rather than via a SQL window function, per the "keep it
 * portable" instruction.
 */
async function computeStudentTotals(schoolId: string, examId: string, sectionId: string): Promise<StudentTotal[]> {
  const students = await prisma.student.findMany({
    where: { schoolId, sectionId, deletedAt: null, status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true, registrationNumber: true },
  });
  if (students.length === 0) return [];

  const schedules = await prisma.examSchedule.findMany({
    where: { examId, sectionId },
    include: { subject: true, marks: true },
  });
  if (schedules.length === 0) {
    throw new NotFoundError("No exam schedules found for this exam and section");
  }

  const scales = await prisma.gradeScale.findMany({ where: { schoolId } });
  const gradeFor = (percentage: number) =>
    scales.find((s) => percentage >= Number(s.minPercent) && percentage <= Number(s.maxPercent));

  const withoutRank = students.map((student) => {
    let totalMarks = 0;
    let totalMaxMarks = 0;
    let gpaSum = 0;
    let gpaCount = 0;
    const subjectMarks: ReportCardSubjectRow[] = [];

    for (const schedule of schedules) {
      const mark = schedule.marks.find((m) => m.studentId === student.id);
      const maxMarks = Number(schedule.maxMarks);
      const marksObtained = mark ? Number(mark.marksObtained) : 0;
      totalMarks += marksObtained;
      totalMaxMarks += maxMarks;

      const subjectPercentage = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
      const scale = gradeFor(subjectPercentage);
      if (scale) {
        gpaSum += Number(scale.gpaPoint);
        gpaCount += 1;
      }

      subjectMarks.push({
        subjectName: schedule.subject.name,
        marksObtained,
        maxMarks,
        grade: mark?.grade ?? scale?.grade ?? null,
      });
    }

    const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    const gpa = gpaCount > 0 ? gpaSum / gpaCount : null;

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      registrationNumber: student.registrationNumber,
      totalMarks,
      totalMaxMarks,
      percentage,
      gpa,
      subjectMarks,
    };
  });

  const sorted = [...withoutRank].sort((a, b) => b.totalMarks - a.totalMarks);
  const rankByStudentId = new Map<string, number>();
  let rank = 0;
  let prevTotal: number | null = null;
  sorted.forEach((entry, index) => {
    if (prevTotal === null || entry.totalMarks !== prevTotal) {
      rank = index + 1;
      prevTotal = entry.totalMarks;
    }
    rankByStudentId.set(entry.studentId, rank);
  });

  return withoutRank.map((entry) => ({ ...entry, rank: rankByStudentId.get(entry.studentId)! }));
}

/**
 * Generates (or regenerates) report cards for every active student in `sectionId` under `examId`,
 * renders a PDF per student, and publishes them (sets `publishedAt`, stores `filePath`). Blocks the
 * whole batch with a ConflictError if any of the affected students already has a published report
 * card for this exam — publishing is a one-way transition; edits/regeneration are not allowed after.
 */
export async function publishReportCards(schoolId: string, input: PublishReportCardsInput) {
  const exam = await prisma.exam.findFirst({ where: { id: input.examId, schoolId, deletedAt: null } });
  if (!exam) throw new NotFoundError("Exam not found");

  const section = await prisma.section.findFirst({
    where: { id: input.sectionId, schoolId, deletedAt: null },
    include: { class: true },
  });
  if (!section) throw new NotFoundError("Section not found");

  const totals = await computeStudentTotals(schoolId, input.examId, input.sectionId);

  const alreadyPublished = await prisma.reportCard.findMany({
    where: {
      schoolId,
      examId: input.examId,
      studentId: { in: totals.map((t) => t.studentId) },
      publishedAt: { not: null },
    },
  });
  if (alreadyPublished.length > 0) {
    throw new ConflictError(
      `${alreadyPublished.length} report card(s) for this exam and section are already published and cannot be regenerated`
    );
  }

  const results = [];
  for (const total of totals) {
    const pdfBuffer = await generateReportCardPdf({
      exam,
      studentName: total.studentName,
      registrationNumber: total.registrationNumber,
      sectionLabel: `${section.class.name} - ${section.name}`,
      subjectMarks: total.subjectMarks,
      totalMarks: total.totalMarks,
      totalMaxMarks: total.totalMaxMarks,
      percentage: total.percentage,
      gpa: total.gpa,
      rank: total.rank,
    });
    const { filePath } = await storage.save(pdfBuffer, `report-card-${total.studentId}.pdf`, `report-cards/${exam.id}`);

    const reportCard = await prisma.reportCard.upsert({
      where: { studentId_examId: { studentId: total.studentId, examId: input.examId } },
      create: {
        schoolId,
        studentId: total.studentId,
        examId: input.examId,
        academicSessionId: exam.academicSessionId,
        gpa: total.gpa,
        totalMarks: total.totalMarks,
        percentage: total.percentage,
        rank: total.rank,
        publishedAt: new Date(),
        filePath,
      },
      update: {
        gpa: total.gpa,
        totalMarks: total.totalMarks,
        percentage: total.percentage,
        rank: total.rank,
        publishedAt: new Date(),
        filePath,
      },
      include: REPORT_CARD_INCLUDE,
    });
    results.push(reportCard);
  }

  return results;
}

export function listReportCards(schoolId: string, examId?: string, sectionId?: string) {
  return prisma.reportCard.findMany({
    where: {
      schoolId,
      ...(examId ? { examId } : {}),
      ...(sectionId ? { student: { sectionId } } : {}),
    },
    include: REPORT_CARD_INCLUDE,
    orderBy: [{ rank: "asc" }],
  });
}

async function resolveOwnStudentIds(schoolId: string, userId: string): Promise<string[]> {
  const student = await prisma.student.findFirst({ where: { userId, schoolId, deletedAt: null } });
  if (student) return [student.id];

  const guardian = await prisma.guardian.findFirst({ where: { userId, schoolId, deletedAt: null } });
  if (guardian) {
    const links = await prisma.studentGuardian.findMany({ where: { guardianId: guardian.id } });
    return links.map((l) => l.studentId);
  }
  return [];
}

export async function listReportCardsForCaller(
  schoolId: string,
  requester: { userId: string; permissions: Permission[] },
  filters: { examId?: string; sectionId?: string }
) {
  const canReadAll = requester.permissions.includes("report_card:publish") || requester.permissions.includes("mark:read");
  if (canReadAll) return listReportCards(schoolId, filters.examId, filters.sectionId);

  const ownIds = await resolveOwnStudentIds(schoolId, requester.userId);
  if (ownIds.length === 0) return [];

  return prisma.reportCard.findMany({
    where: {
      schoolId,
      studentId: { in: ownIds },
      publishedAt: { not: null },
      ...(filters.examId ? { examId: filters.examId } : {}),
    },
    include: REPORT_CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function getReportCardForCaller(
  schoolId: string,
  requester: { userId: string; permissions: Permission[] },
  id: string
) {
  const reportCard = await prisma.reportCard.findFirst({ where: { id, schoolId }, include: REPORT_CARD_INCLUDE });
  if (!reportCard) throw new NotFoundError("Report card not found");

  const canReadAll = requester.permissions.includes("report_card:publish") || requester.permissions.includes("mark:read");
  if (!canReadAll) {
    const ownIds = await resolveOwnStudentIds(schoolId, requester.userId);
    if (!ownIds.includes(reportCard.studentId) || !reportCard.publishedAt) {
      throw new NotFoundError("Report card not found");
    }
  }

  return reportCard;
}

/** Subject-wise marks for a single student's report card detail view (recomputed from Mark rows, not stored on ReportCard). */
export function getReportCardSubjectMarks(examId: string, studentId: string) {
  return prisma.mark.findMany({
    where: { studentId, examSchedule: { examId } },
    include: { examSchedule: { include: { subject: true } } },
  });
}
