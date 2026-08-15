import type {
  CreateCoScholasticGradeInput,
  CreateExamInput,
  CreateExamScheduleInput,
  CreateGradeScaleInput,
  EnterMarksInput,
} from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors";

const EXAM_INCLUDE = { academicSession: true } as const;

async function findExamOrThrow(schoolId: string, id: string) {
  const exam = await prisma.exam.findFirst({ where: { id, schoolId, deletedAt: null }, include: EXAM_INCLUDE });
  if (!exam) throw new NotFoundError("Exam not found");
  return exam;
}

// --- Exams ---

export async function createExam(schoolId: string, input: CreateExamInput) {
  return prisma.exam.create({
    data: {
      schoolId,
      name: input.name,
      examType: input.examType,
      academicSessionId: input.academicSessionId,
      startDate: input.startDate,
      endDate: input.endDate,
    },
    include: EXAM_INCLUDE,
  });
}

export function listExams(schoolId: string, academicSessionId?: string) {
  return prisma.exam.findMany({
    where: { schoolId, deletedAt: null, ...(academicSessionId ? { academicSessionId } : {}) },
    include: EXAM_INCLUDE,
    orderBy: { startDate: "desc" },
  });
}

export async function getExam(schoolId: string, id: string) {
  return findExamOrThrow(schoolId, id);
}

// --- Exam Schedules ---

const EXAM_SCHEDULE_INCLUDE = {
  exam: true,
  subject: true,
  section: { include: { class: true } },
} as const;

export async function createExamSchedule(schoolId: string, input: CreateExamScheduleInput) {
  await findExamOrThrow(schoolId, input.examId);

  const duplicate = await prisma.examSchedule.findUnique({
    where: {
      examId_subjectId_sectionId: {
        examId: input.examId,
        subjectId: input.subjectId,
        sectionId: input.sectionId,
      },
    },
  });
  if (duplicate) {
    throw new ConflictError("A schedule for this subject and section already exists under this exam");
  }

  return prisma.examSchedule.create({
    data: {
      examId: input.examId,
      subjectId: input.subjectId,
      sectionId: input.sectionId,
      examDate: input.examDate,
      startTime: input.startTime,
      endTime: input.endTime,
      maxMarks: input.maxMarks,
      passingMarks: input.passingMarks,
    },
    include: EXAM_SCHEDULE_INCLUDE,
  });
}

export function listExamSchedules(schoolId: string, examId?: string, sectionId?: string) {
  return prisma.examSchedule.findMany({
    where: {
      exam: { schoolId, deletedAt: null },
      ...(examId ? { examId } : {}),
      ...(sectionId ? { sectionId } : {}),
    },
    include: EXAM_SCHEDULE_INCLUDE,
    orderBy: { examDate: "asc" },
  });
}

async function findExamScheduleOrThrow(schoolId: string, id: string) {
  const schedule = await prisma.examSchedule.findFirst({
    where: { id, exam: { schoolId, deletedAt: null } },
    include: EXAM_SCHEDULE_INCLUDE,
  });
  if (!schedule) throw new NotFoundError("Exam schedule not found");
  return schedule;
}

// --- Grade Scales ---

export async function createGradeScale(schoolId: string, input: CreateGradeScaleInput) {
  if (input.minPercent >= input.maxPercent) {
    throw new BadRequestError("minPercent must be less than maxPercent");
  }
  return prisma.gradeScale.create({
    data: {
      schoolId,
      name: input.name,
      minPercent: input.minPercent,
      maxPercent: input.maxPercent,
      grade: input.grade,
      gpaPoint: input.gpaPoint,
    },
  });
}

export function listGradeScales(schoolId: string) {
  return prisma.gradeScale.findMany({ where: { schoolId }, orderBy: { minPercent: "desc" } });
}

// --- Marks entry ---

/**
 * Bulk-enters marks for every student against a single exam schedule. Grade is resolved from the
 * school's GradeScale rows immediately (`marksObtained / maxMarks * 100`, then a `minPercent <= p <= maxPercent`
 * match) and denormalized onto the Mark row so downstream report-card aggregation never has to re-derive it.
 */
export async function enterMarks(schoolId: string, enteredById: string, input: EnterMarksInput) {
  const schedule = await findExamScheduleOrThrow(schoolId, input.examScheduleId);
  const maxMarks = Number(schedule.maxMarks);
  const scales = await prisma.gradeScale.findMany({ where: { schoolId } });

  const ops = input.entries.map((entry) => {
    if (entry.marksObtained > maxMarks) {
      throw new BadRequestError(
        `Marks obtained (${entry.marksObtained}) cannot exceed max marks (${maxMarks}) for student ${entry.studentId}`
      );
    }
    const percentage = maxMarks > 0 ? (entry.marksObtained / maxMarks) * 100 : 0;
    const scale = scales.find((s) => percentage >= Number(s.minPercent) && percentage <= Number(s.maxPercent));

    return prisma.mark.upsert({
      where: { examScheduleId_studentId: { examScheduleId: input.examScheduleId, studentId: entry.studentId } },
      create: {
        examScheduleId: input.examScheduleId,
        studentId: entry.studentId,
        marksObtained: entry.marksObtained,
        grade: scale?.grade ?? null,
        remarks: entry.remarks,
        enteredById,
      },
      update: {
        marksObtained: entry.marksObtained,
        grade: scale?.grade ?? null,
        remarks: entry.remarks,
        enteredById,
      },
    });
  });

  return prisma.$transaction(ops);
}

export function listMarks(schoolId: string, examScheduleId: string) {
  return prisma.mark.findMany({
    where: { examScheduleId, examSchedule: { exam: { schoolId, deletedAt: null } } },
    include: { student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } } },
    orderBy: { student: { registrationNumber: "asc" } },
  });
}

// --- Co-scholastic (non-academic) grading ---

export async function upsertCoScholasticGrade(
  schoolId: string,
  enteredById: string,
  input: CreateCoScholasticGradeInput
) {
  await findExamOrThrow(schoolId, input.examId);
  const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId, deletedAt: null } });
  if (!student) throw new BadRequestError("Student not found in this school");

  return prisma.coScholasticGrade.upsert({
    where: {
      studentId_examId_activity: { studentId: input.studentId, examId: input.examId, activity: input.activity },
    },
    create: {
      schoolId,
      enteredById,
      studentId: input.studentId,
      examId: input.examId,
      activity: input.activity,
      grade: input.grade,
      remarks: input.remarks,
    },
    update: { grade: input.grade, remarks: input.remarks, enteredById },
  });
}

export function listCoScholasticGrades(schoolId: string, examId?: string, studentId?: string) {
  return prisma.coScholasticGrade.findMany({
    where: { schoolId, ...(examId ? { examId } : {}), ...(studentId ? { studentId } : {}) },
    include: { student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } } },
    orderBy: { createdAt: "desc" },
  });
}
