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
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import * as reportCardService from "../exams/reportCard.service";

const ACTIVE_STUDENT_SELECT = {
  id: true,
  registrationNumber: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  rollNumber: true,
  section: { select: { name: true, class: { select: { name: true } } } },
} as const;

export async function getBirthdayReport(schoolId: string, query: BirthdayReportQuery) {
  const students = await prisma.student.findMany({
    where: { schoolId, deletedAt: null, status: "ACTIVE" },
    select: ACTIVE_STUDENT_SELECT,
    orderBy: { dateOfBirth: "asc" },
  });

  const filtered = query.month
    ? students.filter((s) => s.dateOfBirth.getUTCMonth() + 1 === query.month)
    : students;

  return filtered
    .map((s) => ({ ...s, birthDay: s.dateOfBirth.getUTCDate(), birthMonth: s.dateOfBirth.getUTCMonth() + 1 }))
    .sort((a, b) => a.birthMonth - b.birthMonth || a.birthDay - b.birthDay);
}

export async function getClassWiseStudentReport(schoolId: string, query: ClassWiseStudentReportQuery) {
  return prisma.student.findMany({
    where: {
      schoolId,
      deletedAt: null,
      status: "ACTIVE",
      ...(query.classId ? { section: { classId: query.classId } } : {}),
      ...(query.sectionId ? { sectionId: query.sectionId } : {}),
    },
    select: ACTIVE_STUDENT_SELECT,
    orderBy: [{ section: { class: { order: "asc" } } }, { section: { name: "asc" } }, { rollNumber: "asc" }],
  });
}

export async function getSubjectWiseReport(schoolId: string, query: SubjectWiseReportQuery) {
  const marks = await prisma.mark.findMany({
    where: {
      examSchedule: { examId: query.examId, subjectId: query.subjectId, exam: { schoolId, deletedAt: null } },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true, rollNumber: true } },
      examSchedule: { include: { subject: true } },
    },
    orderBy: { student: { rollNumber: "asc" } },
  });

  return marks.map((m) => ({
    studentId: m.student.id,
    registrationNumber: m.student.registrationNumber,
    firstName: m.student.firstName,
    lastName: m.student.lastName,
    rollNumber: m.student.rollNumber,
    subjectName: m.examSchedule.subject.name,
    marksObtained: Number(m.marksObtained),
    maxMarks: Number(m.examSchedule.maxMarks),
    grade: m.grade,
  }));
}

export async function getFeeCollectionsReport(schoolId: string, query: FeeCollectionsReportQuery) {
  const payments = await prisma.payment.findMany({
    where: {
      schoolId,
      ...(query.receivedById ? { receivedById: query.receivedById } : {}),
      ...(query.dateFrom || query.dateTo
        ? { paidAt: { ...(query.dateFrom ? { gte: query.dateFrom } : {}), ...(query.dateTo ? { lte: query.dateTo } : {}) } }
        : {}),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
    },
    orderBy: { paidAt: "desc" },
  });

  const receivers = await prisma.user.findMany({
    where: { id: { in: [...new Set(payments.map((p) => p.receivedById))] } },
    select: { id: true, fullName: true },
  });
  const receiverName = new Map(receivers.map((u) => [u.id, u.fullName]));

  return payments.map((p) => ({
    id: p.id,
    receiptNumber: p.receiptNumber,
    studentName: `${p.student.firstName} ${p.student.lastName}`,
    registrationNumber: p.student.registrationNumber,
    amount: Number(p.amount),
    method: p.method,
    receivedByName: receiverName.get(p.receivedById) ?? "-",
    paidAt: p.paidAt,
  }));
}

export async function getPendingFeesReport(schoolId: string, query: PendingFeesReportQuery) {
  const invoices = await prisma.invoice.findMany({
    where: {
      schoolId,
      status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
      ...(query.academicSessionId ? { academicSessionId: query.academicSessionId } : {}),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
      academicSession: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return invoices.map((inv) => ({
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    studentName: `${inv.student.firstName} ${inv.student.lastName}`,
    registrationNumber: inv.student.registrationNumber,
    academicSessionName: inv.academicSession.name,
    dueDate: inv.dueDate,
    status: inv.status,
    totalAmount: Number(inv.totalAmount),
    paidAmount: Number(inv.paidAmount),
    outstanding: Number(inv.totalAmount) - Number(inv.paidAmount),
  }));
}

export async function getChequeListReport(schoolId: string, query: ChequeListReportQuery) {
  const payments = await prisma.payment.findMany({
    where: {
      schoolId,
      method: "CHEQUE",
      ...(query.dateFrom || query.dateTo
        ? { paidAt: { ...(query.dateFrom ? { gte: query.dateFrom } : {}), ...(query.dateTo ? { lte: query.dateTo } : {}) } }
        : {}),
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } } },
    orderBy: { paidAt: "desc" },
  });

  return payments.map((p) => ({
    id: p.id,
    receiptNumber: p.receiptNumber,
    transactionRef: p.transactionRef,
    studentName: `${p.student.firstName} ${p.student.lastName}`,
    registrationNumber: p.student.registrationNumber,
    amount: Number(p.amount),
    paidAt: p.paidAt,
  }));
}

export async function getRankReport(schoolId: string, query: RankReportQuery) {
  const reportCards = await reportCardService.listReportCards(schoolId, query.examId, query.sectionId);
  return reportCards.map((rc) => ({
    studentId: rc.studentId,
    studentName: `${rc.student.firstName} ${rc.student.lastName}`,
    registrationNumber: rc.student.registrationNumber,
    examName: rc.exam.name,
    totalMarks: rc.totalMarks ? Number(rc.totalMarks) : null,
    percentage: rc.percentage ? Number(rc.percentage) : null,
    gpa: rc.gpa ? Number(rc.gpa) : null,
    rank: rc.rank,
  }));
}

export async function getClassWiseWorkingDaysReport(schoolId: string, query: WorkingDaysReportQuery) {
  const records = await prisma.studentAttendance.findMany({
    where: {
      schoolId,
      sectionId: query.sectionId,
      ...(query.dateFrom || query.dateTo
        ? { date: { ...(query.dateFrom ? { gte: query.dateFrom } : {}), ...(query.dateTo ? { lte: query.dateTo } : {}) } }
        : {}),
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } } },
  });

  const workingDays = new Set(records.map((r) => r.date.toISOString().slice(0, 10))).size;

  const byStudent = new Map<
    string,
    { studentId: string; studentName: string; registrationNumber: string; present: number; absent: number }
  >();
  for (const r of records) {
    const entry = byStudent.get(r.studentId) ?? {
      studentId: r.studentId,
      studentName: `${r.student.firstName} ${r.student.lastName}`,
      registrationNumber: r.student.registrationNumber,
      present: 0,
      absent: 0,
    };
    if (r.status === "PRESENT" || r.status === "LATE" || r.status === "HALF_DAY") entry.present += 1;
    else entry.absent += 1;
    byStudent.set(r.studentId, entry);
  }

  return {
    workingDays,
    students: Array.from(byStudent.values()).map((s) => ({
      ...s,
      attendancePercentage: workingDays > 0 ? Math.round((s.present / workingDays) * 1000) / 10 : 0,
    })),
  };
}

export async function getRouteWiseTransportReport(schoolId: string, routeId: string) {
  const route = await prisma.route.findFirst({
    where: { id: routeId, schoolId, deletedAt: null },
    include: { vehicle: true },
  });
  if (!route) throw new NotFoundError("Route not found");

  const [assignments, transportFee] = await Promise.all([
    prisma.routeAssignment.findMany({
      where: { routeId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
        pickupPoint: { select: { name: true } },
      },
    }),
    prisma.transportFee.findFirst({ where: { schoolId, routeId } }),
  ]);

  const feeAmount = transportFee ? Number(transportFee.amount) : 0;

  return {
    routeId: route.id,
    routeName: route.name,
    vehicleCapacity: route.vehicle?.capacity ?? null,
    headcount: assignments.length,
    monthlyFeePerStudent: feeAmount,
    totalMonthlyFee: Math.round(feeAmount * assignments.length * 100) / 100,
    students: assignments.map((a) => ({
      studentId: a.student.id,
      studentName: `${a.student.firstName} ${a.student.lastName}`,
      registrationNumber: a.student.registrationNumber,
      pickupPointName: a.pickupPoint?.name ?? null,
    })),
  };
}

export async function getDayBookReport(schoolId: string, query: DayBookReportQuery) {
  const startOfDay = new Date(query.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(query.date);
  endOfDay.setHours(23, 59, 59, 999);

  const [journalLines, cashBookEntries] = await Promise.all([
    prisma.journalLine.findMany({
      where: { journalEntry: { schoolId, entryDate: { gte: startOfDay, lte: endOfDay } } },
      include: { account: true, journalEntry: true },
      orderBy: { journalEntry: { entryDate: "asc" } },
    }),
    prisma.cashBookEntry.findMany({
      where: { schoolId, date: { gte: startOfDay, lte: endOfDay } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const journalRows = journalLines.map((l) => ({
    accountName: l.account.name,
    description: l.journalEntry.description,
    voucherType: l.journalEntry.voucherType,
    voucherNumber: l.journalEntry.voucherNumber,
    debit: Number(l.debit),
    credit: Number(l.credit),
  }));
  const cashBookRows = cashBookEntries.map((e) => ({
    description: e.description,
    debit: Number(e.debit),
    credit: Number(e.credit),
    balance: Number(e.balance),
  }));

  return {
    date: query.date,
    journalLines: journalRows,
    cashBookEntries: cashBookRows,
    totalDebit: Math.round((journalRows.reduce((s, r) => s + r.debit, 0) + cashBookRows.reduce((s, r) => s + r.debit, 0)) * 100) / 100,
    totalCredit: Math.round((journalRows.reduce((s, r) => s + r.credit, 0) + cashBookRows.reduce((s, r) => s + r.credit, 0)) * 100) / 100,
  };
}

export async function getBankStatementReport(schoolId: string, bankAccountId: string, query: BankStatementReportQuery) {
  const bankAccount = await prisma.bankAccount.findFirst({
    where: { id: bankAccountId, schoolId },
    include: { account: true },
  });
  if (!bankAccount) throw new NotFoundError("Bank account not found");

  const lines = await prisma.journalLine.findMany({
    where: {
      accountId: bankAccount.accountId,
      journalEntry: {
        schoolId,
        ...(query.dateFrom || query.dateTo
          ? { entryDate: { ...(query.dateFrom ? { gte: query.dateFrom } : {}), ...(query.dateTo ? { lte: query.dateTo } : {}) } }
          : {}),
      },
    },
    include: { journalEntry: true },
    orderBy: { journalEntry: { entryDate: "asc" } },
  });

  let balance = 0;
  const entries = lines.map((l) => {
    const debit = Number(l.debit);
    const credit = Number(l.credit);
    balance += debit - credit;
    return {
      date: l.journalEntry.entryDate,
      description: l.journalEntry.description,
      voucherNumber: l.journalEntry.voucherNumber,
      debit,
      credit,
      balance: Math.round(balance * 100) / 100,
    };
  });

  return {
    bankAccountId: bankAccount.id,
    bankName: bankAccount.bankName,
    accountNumber: bankAccount.accountNumber,
    entries,
    closingBalance: entries.length > 0 ? entries[entries.length - 1].balance : 0,
  };
}

export async function getStockReport(schoolId: string, query: StockReportQuery) {
  const items = await prisma.inventoryItem.findMany({
    where: { schoolId, deletedAt: null, ...(query.category ? { category: query.category } : {}) },
    orderBy: { name: "asc" },
  });

  return items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    unit: i.unit,
    quantity: i.quantity,
    reorderLevel: i.reorderLevel,
    belowReorderLevel: i.quantity <= i.reorderLevel,
  }));
}

export async function getDailySalesReport(schoolId: string, query: DailySalesReportQuery) {
  const startOfDay = new Date(query.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(query.date);
  endOfDay.setHours(23, 59, 59, 999);

  const sales = await prisma.sale.findMany({
    where: { schoolId, status: { not: "CANCELLED" }, createdAt: { gte: startOfDay, lte: endOfDay } },
    include: {
      items: true,
      counterparty: { select: { name: true } },
      soldBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = sales.map((s) => ({
    saleId: s.id,
    saleNumber: s.saleNumber,
    counterpartyName: s.counterparty?.name ?? "Walk-in",
    soldByName: s.soldBy.fullName,
    itemCount: s.items.reduce((sum, i) => sum + i.quantity, 0),
    totalAmount: Number(s.totalAmount),
    paidAmount: Number(s.paidAmount),
    createdAt: s.createdAt,
  }));

  return {
    date: query.date,
    sales: rows,
    totalSalesCount: rows.length,
    totalAmount: Math.round(rows.reduce((sum, r) => sum + r.totalAmount, 0) * 100) / 100,
    totalCollected: Math.round(rows.reduce((sum, r) => sum + r.paidAmount, 0) * 100) / 100,
  };
}
