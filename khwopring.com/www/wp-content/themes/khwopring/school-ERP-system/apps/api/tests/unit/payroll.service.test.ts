import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  payrollRun: { findFirst: vi.fn(), update: vi.fn() },
  payslip: { findFirst: vi.fn(), update: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("../../src/lib/storage", () => ({ storage: { save: vi.fn() } }));

import {
  assertPayrollTransition,
  computeNetSalary,
  markRunPaid,
  processRun,
} from "../../src/modules/payroll/payroll.service";

describe("payroll.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeNetSalary", () => {
    it("computes gross salary (basic + allowances) and net salary (gross - deductions)", () => {
      const result = computeNetSalary({
        basicSalary: 30000,
        allowances: [{ amount: 2000 }, { amount: 1000 }],
        deductions: [{ amount: 500 }],
      });

      expect(result.grossSalary).toBe(33000);
      expect(result.totalDeductions).toBe(500);
      expect(result.netSalary).toBe(32500);
    });

    it("handles Decimal-like values (strings) the way Prisma returns them", () => {
      const result = computeNetSalary({
        basicSalary: "25000.50" as unknown as number,
        allowances: [{ amount: "1500.25" as unknown as number }],
        deductions: [{ amount: "200.75" as unknown as number }],
      });

      expect(result.grossSalary).toBeCloseTo(26500.75);
      expect(result.netSalary).toBeCloseTo(26300);
    });

    it("returns net salary equal to gross when there are no deductions", () => {
      const result = computeNetSalary({ basicSalary: 10000, allowances: [], deductions: [] });
      expect(result.grossSalary).toBe(10000);
      expect(result.totalDeductions).toBe(0);
      expect(result.netSalary).toBe(10000);
    });
  });

  describe("assertPayrollTransition", () => {
    it("allows DRAFT -> PROCESSED and PROCESSED -> PAID", () => {
      expect(() => assertPayrollTransition("DRAFT", "PROCESSED")).not.toThrow();
      expect(() => assertPayrollTransition("PROCESSED", "PAID")).not.toThrow();
    });

    it("rejects an invalid direct jump from DRAFT to PAID", () => {
      expect(() => assertPayrollTransition("DRAFT", "PAID")).toThrow(/cannot move payroll run/i);
    });

    it("rejects moving backward from PAID to DRAFT", () => {
      expect(() => assertPayrollTransition("PAID", "DRAFT")).toThrow(/cannot move payroll run/i);
    });
  });

  describe("processRun / markRunPaid transition guards", () => {
    it("rejects processing a run that has no payslips generated yet", async () => {
      mockPrisma.payrollRun.findFirst.mockResolvedValue({
        id: "run_1",
        schoolId: "school_1",
        status: "DRAFT",
        payslips: [],
      });

      await expect(processRun("school_1", "run_1", "user_1")).rejects.toThrow(/no payslips/i);
      expect(mockPrisma.payrollRun.update).not.toHaveBeenCalled();
    });

    it("rejects moving a payroll run directly from DRAFT to PAID via markRunPaid", async () => {
      mockPrisma.payrollRun.findFirst.mockResolvedValue({
        id: "run_2",
        schoolId: "school_1",
        status: "DRAFT",
        payslips: [{ id: "payslip_1", filePath: null }],
      });

      await expect(markRunPaid("school_1", "run_2")).rejects.toThrow(/cannot move payroll run/i);
      expect(mockPrisma.payrollRun.update).not.toHaveBeenCalled();
    });

    it("rejects re-processing a run that has already been marked PAID", async () => {
      mockPrisma.payrollRun.findFirst.mockResolvedValue({
        id: "run_3",
        schoolId: "school_1",
        status: "PAID",
        payslips: [{ id: "payslip_1", filePath: "payslips/x.pdf" }],
      });

      await expect(processRun("school_1", "run_3", "user_1")).rejects.toThrow(/cannot move payroll run/i);
      expect(mockPrisma.payrollRun.update).not.toHaveBeenCalled();
    });
  });
});
