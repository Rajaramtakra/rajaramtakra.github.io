import { z } from "zod";

/** Mirrors the Prisma `ExamType` enum (schema.prisma:104-110). Defined locally per module coordination rules. */
export const EXAM_TYPES = ["UNIT_TEST", "MID_TERM", "FINAL", "PRACTICAL", "OTHER"] as const;

export const createExamSchema = z.object({
  name: z.string().min(2).max(100),
  examType: z.enum(EXAM_TYPES),
  academicSessionId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
export type CreateExamInput = z.infer<typeof createExamSchema>;

export const createExamScheduleSchema = z.object({
  examId: z.string().min(1),
  subjectId: z.string().min(1),
  sectionId: z.string().min(1),
  examDate: z.coerce.date(),
  startTime: z.string().min(1).max(10),
  endTime: z.string().min(1).max(10),
  maxMarks: z.coerce.number().positive(),
  passingMarks: z.coerce.number().nonnegative(),
});
export type CreateExamScheduleInput = z.infer<typeof createExamScheduleSchema>;

export const enterMarksSchema = z.object({
  examScheduleId: z.string().min(1),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        marksObtained: z.coerce.number().nonnegative(),
        remarks: z.string().max(300).optional(),
      })
    )
    .min(1),
});
export type EnterMarksInput = z.infer<typeof enterMarksSchema>;

export const createGradeScaleSchema = z.object({
  name: z.string().min(1).max(50),
  minPercent: z.coerce.number().min(0).max(100),
  maxPercent: z.coerce.number().min(0).max(100),
  grade: z.string().min(1).max(10),
  gpaPoint: z.coerce.number().min(0).max(10),
});
export type CreateGradeScaleInput = z.infer<typeof createGradeScaleSchema>;

export const publishReportCardsSchema = z.object({
  examId: z.string().min(1),
  sectionId: z.string().min(1),
});
export type PublishReportCardsInput = z.infer<typeof publishReportCardsSchema>;

export const createCoScholasticGradeSchema = z.object({
  studentId: z.string().min(1),
  examId: z.string().min(1),
  activity: z.string().min(2).max(60),
  grade: z.string().min(1).max(10),
  remarks: z.string().max(300).optional(),
});
export type CreateCoScholasticGradeInput = z.infer<typeof createCoScholasticGradeSchema>;

export const admitCardQuerySchema = z.object({
  examId: z.string().min(1),
  sectionId: z.string().min(1),
});
export type AdmitCardQuery = z.infer<typeof admitCardQuerySchema>;
