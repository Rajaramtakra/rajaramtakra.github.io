import type { Request, Response } from "express";
import type {
  BankStatementReportQuery,
  BirthdayReportQuery,
  ChequeListReportQuery,
  ClassWiseStudentReportQuery,
  DailySalesReportQuery,
  DayBookReportQuery,
  FeeCollectionsReportQuery,
  PendingFeesReportQuery,
  RankReportQuery,
  StockReportQuery,
  SubjectWiseReportQuery,
  WorkingDaysReportQuery,
} from "@erp/shared";
import { asyncHandler } from "../../middleware/asyncHandler";
import { sendCsv, toCsv, type CsvColumn } from "../../lib/csv";
import * as reportsService from "./reports.service";

type StudentReportRow = Awaited<ReturnType<typeof reportsService.getClassWiseStudentReport>>[number];

const STUDENT_REPORT_COLUMNS: CsvColumn<StudentReportRow>[] = [
  { key: "registrationNumber", label: "Registration No." },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "class", label: "Class", value: (r) => r.section?.class?.name },
  { key: "section", label: "Section", value: (r) => r.section?.name },
  { key: "rollNumber", label: "Roll No." },
  { key: "dateOfBirth", label: "Date of Birth", value: (r) => r.dateOfBirth.toISOString().slice(0, 10) },
];

export const getBirthdayReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as BirthdayReportQuery;
  const students = await reportsService.getBirthdayReport(req.user!.schoolId, query);
  if (query.format === "csv") {
    return sendCsv(res, "birthday-report.csv", toCsv(students, STUDENT_REPORT_COLUMNS));
  }
  res.json({ students });
});

export const getClassWiseStudentReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ClassWiseStudentReportQuery;
  const students = await reportsService.getClassWiseStudentReport(req.user!.schoolId, query);
  if (query.format === "csv") {
    return sendCsv(res, "class-wise-students.csv", toCsv(students, STUDENT_REPORT_COLUMNS));
  }
  res.json({ students });
});

type SubjectWiseRow = Awaited<ReturnType<typeof reportsService.getSubjectWiseReport>>[number];
const SUBJECT_WISE_COLUMNS: CsvColumn<SubjectWiseRow>[] = [
  { key: "registrationNumber", label: "Registration No." },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "rollNumber", label: "Roll No." },
  { key: "subjectName", label: "Subject" },
  { key: "marksObtained", label: "Marks Obtained" },
  { key: "maxMarks", label: "Max Marks" },
  { key: "grade", label: "Grade" },
];

export const getSubjectWiseReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SubjectWiseReportQuery;
  const marks = await reportsService.getSubjectWiseReport(req.user!.schoolId, query);
  if (query.format === "csv") {
    return sendCsv(res, "subject-wise-report.csv", toCsv(marks, SUBJECT_WISE_COLUMNS));
  }
  res.json({ marks });
});

type FeeCollectionRow = Awaited<ReturnType<typeof reportsService.getFeeCollectionsReport>>[number];
const FEE_COLLECTION_COLUMNS: CsvColumn<FeeCollectionRow>[] = [
  { key: "receiptNumber", label: "Receipt No." },
  { key: "studentName", label: "Student" },
  { key: "registrationNumber", label: "Registration No." },
  { key: "amount", label: "Amount" },
  { key: "method", label: "Method" },
  { key: "receivedByName", label: "Received By" },
  { key: "paidAt", label: "Paid At", value: (r) => r.paidAt.toISOString() },
];

export const getFeeCollectionsReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as FeeCollectionsReportQuery;
  const payments = await reportsService.getFeeCollectionsReport(req.user!.schoolId, query);
  if (query.format === "csv") {
    return sendCsv(res, "fee-collections.csv", toCsv(payments, FEE_COLLECTION_COLUMNS));
  }
  res.json({ payments });
});

type PendingFeeRow = Awaited<ReturnType<typeof reportsService.getPendingFeesReport>>[number];
const PENDING_FEES_COLUMNS: CsvColumn<PendingFeeRow>[] = [
  { key: "invoiceNumber", label: "Invoice No." },
  { key: "studentName", label: "Student" },
  { key: "registrationNumber", label: "Registration No." },
  { key: "academicSessionName", label: "Academic Session" },
  { key: "dueDate", label: "Due Date", value: (r) => r.dueDate.toISOString().slice(0, 10) },
  { key: "status", label: "Status" },
  { key: "totalAmount", label: "Total" },
  { key: "paidAmount", label: "Paid" },
  { key: "outstanding", label: "Outstanding" },
];

export const getPendingFeesReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as PendingFeesReportQuery;
  const invoices = await reportsService.getPendingFeesReport(req.user!.schoolId, query);
  if (query.format === "csv") {
    return sendCsv(res, "pending-fees.csv", toCsv(invoices, PENDING_FEES_COLUMNS));
  }
  res.json({ invoices });
});

type ChequeRow = Awaited<ReturnType<typeof reportsService.getChequeListReport>>[number];
const CHEQUE_LIST_COLUMNS: CsvColumn<ChequeRow>[] = [
  { key: "receiptNumber", label: "Receipt No." },
  { key: "transactionRef", label: "Cheque No." },
  { key: "studentName", label: "Student" },
  { key: "registrationNumber", label: "Registration No." },
  { key: "amount", label: "Amount" },
  { key: "paidAt", label: "Paid At", value: (r) => r.paidAt.toISOString() },
];

export const getChequeListReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ChequeListReportQuery;
  const payments = await reportsService.getChequeListReport(req.user!.schoolId, query);
  if (query.format === "csv") {
    return sendCsv(res, "cheque-list.csv", toCsv(payments, CHEQUE_LIST_COLUMNS));
  }
  res.json({ payments });
});

type RankRow = Awaited<ReturnType<typeof reportsService.getRankReport>>[number];
const RANK_REPORT_COLUMNS: CsvColumn<RankRow>[] = [
  { key: "rank", label: "Rank" },
  { key: "studentName", label: "Student" },
  { key: "registrationNumber", label: "Registration No." },
  { key: "examName", label: "Exam" },
  { key: "totalMarks", label: "Total Marks" },
  { key: "percentage", label: "Percentage" },
  { key: "gpa", label: "GPA" },
];

export const getRankReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as RankReportQuery;
  const rows = await reportsService.getRankReport(req.user!.schoolId, query);
  if (query.format === "csv") {
    return sendCsv(res, "rank-report.csv", toCsv(rows, RANK_REPORT_COLUMNS));
  }
  res.json({ rows });
});

export const getClassWiseWorkingDaysReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as WorkingDaysReportQuery;
  const report = await reportsService.getClassWiseWorkingDaysReport(req.user!.schoolId, query);
  if (query.format === "csv") {
    const columns: CsvColumn<(typeof report.students)[number]>[] = [
      { key: "registrationNumber", label: "Registration No." },
      { key: "studentName", label: "Student" },
      { key: "present", label: "Present Days" },
      { key: "absent", label: "Absent Days" },
      { key: "attendancePercentage", label: "Attendance %" },
    ];
    return sendCsv(res, "class-working-days.csv", toCsv(report.students, columns));
  }
  res.json(report);
});

export const getRouteWiseTransportReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.getRouteWiseTransportReport(req.user!.schoolId, req.params.routeId);
  res.json(report);
});

export const getDayBookReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as DayBookReportQuery;
  const report = await reportsService.getDayBookReport(req.user!.schoolId, query);
  res.json(report);
});

export const getBankStatementReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as BankStatementReportQuery;
  const report = await reportsService.getBankStatementReport(req.user!.schoolId, req.params.bankAccountId, query);
  res.json(report);
});

type StockReportRow = Awaited<ReturnType<typeof reportsService.getStockReport>>[number];
const STOCK_REPORT_COLUMNS: CsvColumn<StockReportRow>[] = [
  { key: "name", label: "Item" },
  { key: "category", label: "Category" },
  { key: "unit", label: "Unit" },
  { key: "quantity", label: "Quantity" },
  { key: "reorderLevel", label: "Reorder Level" },
  { key: "belowReorderLevel", label: "Below Reorder Level" },
];

export const getStockReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as StockReportQuery;
  const items = await reportsService.getStockReport(req.user!.schoolId, query);
  if (query.format === "csv") {
    return sendCsv(res, "stock-report.csv", toCsv(items, STOCK_REPORT_COLUMNS));
  }
  res.json({ items });
});

export const getDailySalesReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as DailySalesReportQuery;
  const report = await reportsService.getDailySalesReport(req.user!.schoolId, query);
  res.json(report);
});
