import { z } from "zod";

export const reportQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});
export type ReportQuery = z.infer<typeof reportQuerySchema>;

export const examPerformanceQuerySchema = reportQuerySchema.extend({
  examId: z.string().optional(),
});
export type ExamPerformanceQuery = z.infer<typeof examPerformanceQuerySchema>;

export const birthdayReportQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  format: z.enum(["json", "csv"]).default("json"),
});
export type BirthdayReportQuery = z.infer<typeof birthdayReportQuerySchema>;

export const classWiseStudentReportQuerySchema = z.object({
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});
export type ClassWiseStudentReportQuery = z.infer<typeof classWiseStudentReportQuerySchema>;

export const subjectWiseReportQuerySchema = z.object({
  subjectId: z.string().min(1),
  examId: z.string().min(1),
  format: z.enum(["json", "csv"]).default("json"),
});
export type SubjectWiseReportQuery = z.infer<typeof subjectWiseReportQuerySchema>;

export const feeCollectionsReportQuerySchema = z.object({
  receivedById: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});
export type FeeCollectionsReportQuery = z.infer<typeof feeCollectionsReportQuerySchema>;

export const pendingFeesReportQuerySchema = z.object({
  academicSessionId: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});
export type PendingFeesReportQuery = z.infer<typeof pendingFeesReportQuerySchema>;

export const chequeListReportQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});
export type ChequeListReportQuery = z.infer<typeof chequeListReportQuerySchema>;

export const rankReportQuerySchema = z.object({
  examId: z.string().min(1),
  sectionId: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});
export type RankReportQuery = z.infer<typeof rankReportQuerySchema>;

export const workingDaysReportQuerySchema = z.object({
  sectionId: z.string().min(1),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});
export type WorkingDaysReportQuery = z.infer<typeof workingDaysReportQuerySchema>;

export const dayBookReportQuerySchema = z.object({
  date: z.coerce.date(),
});
export type DayBookReportQuery = z.infer<typeof dayBookReportQuerySchema>;

export const bankStatementReportQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});
export type BankStatementReportQuery = z.infer<typeof bankStatementReportQuerySchema>;

export const stockReportQuerySchema = z.object({
  category: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});
export type StockReportQuery = z.infer<typeof stockReportQuerySchema>;

export const dailySalesReportQuerySchema = z.object({
  date: z.coerce.date(),
});
export type DailySalesReportQuery = z.infer<typeof dailySalesReportQuerySchema>;
