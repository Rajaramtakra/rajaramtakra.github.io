import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  student: { findMany: vi.fn() },
  mark: { findMany: vi.fn() },
  payment: { findMany: vi.fn() },
  invoice: { findMany: vi.fn() },
  user: { findMany: vi.fn() },
  reportCard: { findMany: vi.fn() },
  studentAttendance: { findMany: vi.fn() },
  route: { findFirst: vi.fn() },
  routeAssignment: { findMany: vi.fn() },
  transportFee: { findFirst: vi.fn() },
  journalLine: { findMany: vi.fn() },
  cashBookEntry: { findMany: vi.fn() },
  bankAccount: { findFirst: vi.fn() },
  inventoryItem: { findMany: vi.fn() },
  sale: { findMany: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  getBankStatementReport,
  getBirthdayReport,
  getChequeListReport,
  getClassWiseStudentReport,
  getClassWiseWorkingDaysReport,
  getDailySalesReport,
  getDayBookReport,
  getFeeCollectionsReport,
  getPendingFeesReport,
  getRankReport,
  getRouteWiseTransportReport,
  getStockReport,
  getSubjectWiseReport,
} from "../../src/modules/reports/reports.service";

function student(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "stu_1",
    registrationNumber: "REG-1",
    firstName: "Ada",
    lastName: "Lovelace",
    dateOfBirth: new Date(Date.UTC(2012, 2, 15)),
    rollNumber: "1",
    section: { name: "A", class: { name: "5" } },
    ...overrides,
  };
}

describe("reports.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBirthdayReport", () => {
    it("returns all active students sorted by birth month/day when no month filter is given", async () => {
      mockPrisma.student.findMany.mockResolvedValue([
        student({ id: "a", dateOfBirth: new Date(Date.UTC(2010, 10, 20)) }),
        student({ id: "b", dateOfBirth: new Date(Date.UTC(2011, 0, 5)) }),
      ]);

      const result = await getBirthdayReport("school_1", { format: "json" });

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { schoolId: "school_1", deletedAt: null, status: "ACTIVE" } })
      );
      expect(result.map((r) => r.id)).toEqual(["b", "a"]);
      expect(result[0]).toMatchObject({ birthMonth: 1, birthDay: 5 });
    });

    it("filters to students born in the requested month regardless of birth year", async () => {
      mockPrisma.student.findMany.mockResolvedValue([
        student({ id: "a", dateOfBirth: new Date(Date.UTC(2009, 2, 1)) }),
        student({ id: "b", dateOfBirth: new Date(Date.UTC(2013, 5, 1)) }),
      ]);

      const result = await getBirthdayReport("school_1", { month: 3, format: "json" });

      expect(result.map((r) => r.id)).toEqual(["a"]);
    });
  });

  describe("getClassWiseStudentReport", () => {
    it("filters by classId via the section relation", async () => {
      mockPrisma.student.findMany.mockResolvedValue([student()]);

      await getClassWiseStudentReport("school_1", { classId: "class_1", format: "json" });

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: "school_1", section: { classId: "class_1" } }),
        })
      );
    });

    it("filters by sectionId directly when provided", async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);

      await getClassWiseStudentReport("school_1", { sectionId: "sec_1", format: "json" });

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ sectionId: "sec_1" }) })
      );
    });
  });

  describe("getSubjectWiseReport", () => {
    it("flattens marks for a subject+exam into report rows", async () => {
      mockPrisma.mark.findMany.mockResolvedValue([
        {
          marksObtained: 88,
          grade: "A",
          student: { id: "stu_1", firstName: "Ada", lastName: "Lovelace", registrationNumber: "REG-1", rollNumber: "1" },
          examSchedule: { maxMarks: 100, subject: { name: "Math" } },
        },
      ]);

      const rows = await getSubjectWiseReport("school_1", { subjectId: "sub_1", examId: "exam_1", format: "json" });

      expect(rows).toEqual([
        {
          studentId: "stu_1",
          registrationNumber: "REG-1",
          firstName: "Ada",
          lastName: "Lovelace",
          rollNumber: "1",
          subjectName: "Math",
          marksObtained: 88,
          maxMarks: 100,
          grade: "A",
        },
      ]);
    });
  });

  describe("getFeeCollectionsReport", () => {
    it("resolves receivedById to a user's full name via a secondary lookup", async () => {
      mockPrisma.payment.findMany.mockResolvedValue([
        {
          id: "pay_1",
          receiptNumber: "RCT-1",
          amount: 500,
          method: "CASH",
          receivedById: "user_1",
          paidAt: new Date("2026-01-01"),
          student: { id: "stu_1", firstName: "Ada", lastName: "Lovelace", registrationNumber: "REG-1" },
        },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([{ id: "user_1", fullName: "Jane Accountant" }]);

      const rows = await getFeeCollectionsReport("school_1", { format: "json" });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: ["user_1"] } } })
      );
      expect(rows[0]).toMatchObject({ receivedByName: "Jane Accountant", amount: 500 });
    });
  });

  describe("getPendingFeesReport", () => {
    it("computes outstanding as totalAmount minus paidAmount", async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          id: "inv_1",
          invoiceNumber: "INV-1",
          dueDate: new Date("2026-01-01"),
          status: "PARTIALLY_PAID",
          totalAmount: 1000,
          paidAmount: 300,
          student: { id: "stu_1", firstName: "Ada", lastName: "Lovelace", registrationNumber: "REG-1" },
          academicSession: { name: "2025-26" },
        },
      ]);

      const rows = await getPendingFeesReport("school_1", { format: "json" });

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } }) })
      );
      expect(rows[0].outstanding).toBe(700);
    });
  });

  describe("getChequeListReport", () => {
    it("filters payments to the CHEQUE method only", async () => {
      mockPrisma.payment.findMany.mockResolvedValue([]);

      await getChequeListReport("school_1", { format: "json" });

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ method: "CHEQUE" }) })
      );
    });
  });

  describe("getRankReport", () => {
    it("delegates to reportCard.service's already-sorted rank listing", async () => {
      mockPrisma.reportCard.findMany.mockResolvedValue([
        {
          studentId: "stu_1",
          rank: 1,
          totalMarks: 95,
          percentage: 95,
          gpa: 4,
          student: { firstName: "Ada", lastName: "Lovelace", registrationNumber: "REG-1" },
          exam: { name: "Term 1" },
        },
      ]);

      const rows = await getRankReport("school_1", { examId: "exam_1", format: "json" });

      expect(rows[0]).toMatchObject({ rank: 1, studentName: "Ada Lovelace", examName: "Term 1" });
    });
  });

  describe("getClassWiseWorkingDaysReport", () => {
    it("counts distinct dates as working days and tallies present/absent per student", async () => {
      mockPrisma.studentAttendance.findMany.mockResolvedValue([
        {
          studentId: "stu_1",
          date: new Date("2026-01-05"),
          status: "PRESENT",
          student: { firstName: "Ada", lastName: "Lovelace", registrationNumber: "REG-1" },
        },
        {
          studentId: "stu_1",
          date: new Date("2026-01-06"),
          status: "ABSENT",
          student: { firstName: "Ada", lastName: "Lovelace", registrationNumber: "REG-1" },
        },
      ]);

      const report = await getClassWiseWorkingDaysReport("school_1", { sectionId: "sec_1", format: "json" });

      expect(report.workingDays).toBe(2);
      expect(report.students[0]).toMatchObject({ present: 1, absent: 1, attendancePercentage: 50 });
    });
  });

  describe("getRouteWiseTransportReport", () => {
    it("multiplies the per-student fee by headcount for the route total", async () => {
      mockPrisma.route.findFirst.mockResolvedValue({ id: "route_1", name: "Route A", vehicle: { capacity: 40 } });
      mockPrisma.routeAssignment.findMany.mockResolvedValue([
        {
          student: { id: "stu_1", firstName: "Ada", lastName: "Lovelace", registrationNumber: "REG-1" },
          pickupPoint: { name: "Main Gate" },
        },
        {
          student: { id: "stu_2", firstName: "Bob", lastName: "Smith", registrationNumber: "REG-2" },
          pickupPoint: null,
        },
      ]);
      mockPrisma.transportFee.findFirst.mockResolvedValue({ amount: 500 });

      const report = await getRouteWiseTransportReport("school_1", "route_1");

      expect(report.headcount).toBe(2);
      expect(report.totalMonthlyFee).toBe(1000);
      expect(report.students[0]).toMatchObject({ pickupPointName: "Main Gate" });
    });

    it("throws when the route does not belong to this school", async () => {
      mockPrisma.route.findFirst.mockResolvedValue(null);

      await expect(getRouteWiseTransportReport("school_1", "route_missing")).rejects.toThrow(/not found/i);
    });
  });

  describe("getDayBookReport", () => {
    it("combines journal lines and cash book entries for the given date into totals", async () => {
      mockPrisma.journalLine.findMany.mockResolvedValue([
        {
          debit: 500,
          credit: 0,
          account: { name: "Cash" },
          journalEntry: { description: "Fee collection", voucherType: "RECEIPT", voucherNumber: "RCV-2026-00001" },
        },
      ]);
      mockPrisma.cashBookEntry.findMany.mockResolvedValue([
        { description: "Petty cash", debit: 0, credit: 100, balance: 400 },
      ]);

      const report = await getDayBookReport("school_1", { date: new Date("2026-01-05") });

      expect(report.totalDebit).toBe(500);
      expect(report.totalCredit).toBe(100);
      expect(report.journalLines[0]).toMatchObject({ accountName: "Cash", voucherNumber: "RCV-2026-00001" });
    });
  });

  describe("getBankStatementReport", () => {
    it("computes a running balance across journal lines posted to the bank's linked account", async () => {
      mockPrisma.bankAccount.findFirst.mockResolvedValue({
        id: "bank_1",
        bankName: "First Bank",
        accountNumber: "1234",
        accountId: "acc_bank",
      });
      mockPrisma.journalLine.findMany.mockResolvedValue([
        { debit: 1000, credit: 0, journalEntry: { entryDate: new Date("2026-01-01"), description: "Deposit", voucherNumber: null } },
        { debit: 0, credit: 300, journalEntry: { entryDate: new Date("2026-01-02"), description: "Withdrawal", voucherNumber: null } },
      ]);

      const report = await getBankStatementReport("school_1", "bank_1", {});

      expect(report.entries.map((e) => e.balance)).toEqual([1000, 700]);
      expect(report.closingBalance).toBe(700);
    });

    it("throws when the bank account does not belong to this school", async () => {
      mockPrisma.bankAccount.findFirst.mockResolvedValue(null);

      await expect(getBankStatementReport("school_1", "bank_missing", {})).rejects.toThrow(/not found/i);
    });
  });

  describe("getStockReport", () => {
    it("flags items at or below their reorder level", async () => {
      mockPrisma.inventoryItem.findMany.mockResolvedValue([
        { id: "item_1", name: "Chalk", category: "Stationery", unit: "box", quantity: 2, reorderLevel: 5 },
        { id: "item_2", name: "Marker", category: "Stationery", unit: "pcs", quantity: 20, reorderLevel: 5 },
      ]);

      const items = await getStockReport("school_1", { format: "json" });

      expect(items[0]).toMatchObject({ name: "Chalk", belowReorderLevel: true });
      expect(items[1]).toMatchObject({ name: "Marker", belowReorderLevel: false });
    });
  });

  describe("getDailySalesReport", () => {
    it("totals amount and collected across the day's non-cancelled sales", async () => {
      mockPrisma.sale.findMany.mockResolvedValue([
        {
          id: "sale_1",
          saleNumber: "SALE-2026-00001",
          totalAmount: 40,
          paidAmount: 40,
          createdAt: new Date("2026-01-05T10:00:00Z"),
          items: [{ quantity: 2 }],
          counterparty: null,
          soldBy: { fullName: "Jane Cashier" },
        },
      ]);

      const report = await getDailySalesReport("school_1", { date: new Date("2026-01-05") });

      expect(report.totalSalesCount).toBe(1);
      expect(report.totalAmount).toBe(40);
      expect(report.totalCollected).toBe(40);
      expect(report.sales[0]).toMatchObject({ counterpartyName: "Walk-in", itemCount: 2 });
    });
  });
});
