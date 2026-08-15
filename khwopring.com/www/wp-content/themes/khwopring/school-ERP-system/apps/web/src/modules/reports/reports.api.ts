import { api } from "@/lib/api";

export interface StudentReportRow {
  id: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  rollNumber: string | null;
  section: { name: string; class: { name: string } } | null;
}

async function downloadCsv(path: string, params: Record<string, string | undefined>, filename: string) {
  const res = await api.get(path, { params: { ...params, format: "csv" }, responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export interface SubjectWiseRow {
  studentId: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string | null;
}

export interface FeeCollectionRow {
  id: string;
  receiptNumber: string | null;
  studentName: string;
  registrationNumber: string;
  amount: number;
  method: string;
  receivedByName: string;
  paidAt: string;
}

export interface PendingFeeRow {
  invoiceId: string;
  invoiceNumber: string;
  studentName: string;
  registrationNumber: string;
  academicSessionName: string;
  dueDate: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
}

export interface ChequeRow {
  id: string;
  receiptNumber: string | null;
  transactionRef: string | null;
  studentName: string;
  registrationNumber: string;
  amount: number;
  paidAt: string;
}

export interface RankRow {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  examName: string;
  totalMarks: number | null;
  percentage: number | null;
  gpa: number | null;
  rank: number | null;
}

export interface WorkingDaysReport {
  workingDays: number;
  students: Array<{
    studentId: string;
    studentName: string;
    registrationNumber: string;
    present: number;
    absent: number;
    attendancePercentage: number;
  }>;
}

export interface RouteWiseTransportReport {
  routeId: string;
  routeName: string;
  vehicleCapacity: number | null;
  headcount: number;
  monthlyFeePerStudent: number;
  totalMonthlyFee: number;
  students: Array<{ studentId: string; studentName: string; registrationNumber: string; pickupPointName: string | null }>;
}

export interface DayBookReport {
  date: string;
  journalLines: Array<{
    accountName: string;
    description: string;
    voucherType: string;
    voucherNumber: string | null;
    debit: number;
    credit: number;
  }>;
  cashBookEntries: Array<{ description: string; debit: number; credit: number; balance: number }>;
  totalDebit: number;
  totalCredit: number;
}

export interface BankStatementReport {
  bankAccountId: string;
  bankName: string;
  accountNumber: string;
  entries: Array<{ date: string; description: string; voucherNumber: string | null; debit: number; credit: number; balance: number }>;
  closingBalance: number;
}

export const reportsApi = {
  getBirthdayReport: (month?: string) =>
    api.get<{ students: StudentReportRow[] }>("/reports/students/birthdays", { params: { month } }).then((r) => r.data.students),
  downloadBirthdayReportCsv: (month?: string) =>
    downloadCsv("/reports/students/birthdays", { month }, "birthday-report.csv"),

  getClassWiseStudentReport: (params: { classId?: string; sectionId?: string }) =>
    api
      .get<{ students: StudentReportRow[] }>("/reports/students/class-wise", { params })
      .then((r) => r.data.students),
  downloadClassWiseStudentReportCsv: (params: { classId?: string; sectionId?: string }) =>
    downloadCsv("/reports/students/class-wise", params, "class-wise-students.csv"),

  getSubjectWiseReport: (params: { subjectId: string; examId: string }) =>
    api.get<{ marks: SubjectWiseRow[] }>("/reports/students/subject-wise", { params }).then((r) => r.data.marks),
  downloadSubjectWiseReportCsv: (params: { subjectId: string; examId: string }) =>
    downloadCsv("/reports/students/subject-wise", params, "subject-wise-report.csv"),

  getFeeCollectionsReport: (params: { receivedById?: string }) =>
    api.get<{ payments: FeeCollectionRow[] }>("/reports/fees/collections", { params }).then((r) => r.data.payments),
  downloadFeeCollectionsCsv: (params: { receivedById?: string }) =>
    downloadCsv("/reports/fees/collections", params, "fee-collections.csv"),

  getPendingFeesReport: (params: { academicSessionId?: string }) =>
    api.get<{ invoices: PendingFeeRow[] }>("/reports/fees/pending", { params }).then((r) => r.data.invoices),
  downloadPendingFeesCsv: (params: { academicSessionId?: string }) =>
    downloadCsv("/reports/fees/pending", params, "pending-fees.csv"),

  getChequeListReport: () =>
    api.get<{ payments: ChequeRow[] }>("/reports/fees/cheques").then((r) => r.data.payments),
  downloadChequeListCsv: () => downloadCsv("/reports/fees/cheques", {}, "cheque-list.csv"),

  getRankReport: (params: { examId: string; sectionId?: string }) =>
    api.get<{ rows: RankRow[] }>("/reports/exams/rank", { params }).then((r) => r.data.rows),
  downloadRankReportCsv: (params: { examId: string; sectionId?: string }) =>
    downloadCsv("/reports/exams/rank", params, "rank-report.csv"),

  getWorkingDaysReport: (params: { sectionId: string }) =>
    api.get<WorkingDaysReport>("/reports/attendance/working-days", { params }).then((r) => r.data),
  downloadWorkingDaysReportCsv: (params: { sectionId: string }) =>
    downloadCsv("/reports/attendance/working-days", params, "class-working-days.csv"),

  getRouteWiseTransportReport: (routeId: string) =>
    api.get<RouteWiseTransportReport>(`/reports/transport/routes/${routeId}`).then((r) => r.data),

  getDayBookReport: (date: string) =>
    api.get<DayBookReport>("/reports/accounting/day-book", { params: { date } }).then((r) => r.data),
  getBankStatementReport: (bankAccountId: string, params?: { dateFrom?: string; dateTo?: string }) =>
    api.get<BankStatementReport>(`/reports/accounting/bank-accounts/${bankAccountId}/statement`, { params }).then((r) => r.data),

  getStockReport: (category?: string) =>
    api.get<{ items: StockReportRow[] }>("/reports/inventory/stock", { params: { category } }).then((r) => r.data.items),
  downloadStockReportCsv: (category?: string) => downloadCsv("/reports/inventory/stock", { category }, "stock-report.csv"),

  getDailySalesReport: (date: string) =>
    api.get<DailySalesReport>("/reports/pos/daily-sales", { params: { date } }).then((r) => r.data),
};

export interface StockReportRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  belowReorderLevel: boolean;
}

export interface DailySalesReport {
  date: string;
  sales: Array<{
    saleId: string;
    saleNumber: string;
    counterpartyName: string;
    soldByName: string;
    itemCount: number;
    totalAmount: number;
    paidAmount: number;
    createdAt: string;
  }>;
  totalSalesCount: number;
  totalAmount: number;
  totalCollected: number;
}
