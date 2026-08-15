import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  student: { findFirst: vi.fn() },
  invoice: { findMany: vi.fn() },
  school: { findUniqueOrThrow: vi.fn() },
  guardian: { findFirst: vi.fn() },
  studentGuardian: { findMany: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { generateNoDuesCertificatePdf, getStudentLedger, getStudentLedgerForCaller } from "../../src/modules/invoices/invoice.service";

describe("invoice.service - student ledger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sums billed/paid across non-cancelled invoices and reports outstanding", async () => {
    mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", schoolId: "school_1" });
    mockPrisma.invoice.findMany.mockResolvedValue([
      { id: "inv_1", status: "PARTIALLY_PAID", totalAmount: 1000, paidAmount: 400 },
      { id: "inv_2", status: "PAID", totalAmount: 500, paidAmount: 500 },
      { id: "inv_3", status: "CANCELLED", totalAmount: 300, paidAmount: 0 },
    ]);

    const ledger = await getStudentLedger("school_1", "stu_1");

    expect(ledger.totalBilled).toBe(1500);
    expect(ledger.totalPaid).toBe(900);
    expect(ledger.totalOutstanding).toBe(600);
  });

  it("throws when the student does not exist in this school", async () => {
    mockPrisma.student.findFirst.mockResolvedValue(null);

    await expect(getStudentLedger("school_1", "stu_missing")).rejects.toThrow(/not found/i);
  });

  describe("getStudentLedgerForCaller", () => {
    it("allows a fee:read_own caller to view their own ledger", async () => {
      mockPrisma.student.findFirst
        .mockResolvedValueOnce({ id: "stu_1", userId: "user_1", schoolId: "school_1" }) // resolveOwnStudentIds lookup
        .mockResolvedValueOnce({ id: "stu_1", schoolId: "school_1" }); // getStudentLedger lookup
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      const ledger = await getStudentLedgerForCaller(
        "school_1",
        { userId: "user_1", permissions: ["fee:read_own"] },
        "stu_1"
      );

      expect(ledger.studentId).toBe("stu_1");
    });

    it("rejects a fee:read_own caller viewing someone else's ledger", async () => {
      mockPrisma.student.findFirst.mockResolvedValueOnce({ id: "stu_1", userId: "user_1", schoolId: "school_1" });
      mockPrisma.guardian.findFirst.mockResolvedValue(null);

      await expect(
        getStudentLedgerForCaller("school_1", { userId: "user_1", permissions: ["fee:read_own"] }, "stu_other")
      ).rejects.toThrow(/not found/i);
    });

    it("rejects a caller with neither invoice:manage nor fee:read_own", async () => {
      await expect(
        getStudentLedgerForCaller("school_1", { userId: "user_1", permissions: [] }, "stu_1")
      ).rejects.toThrow(/not found/i);
    });
  });
});

describe("invoice.service - no-dues certificate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses to issue a certificate while there is an outstanding balance", async () => {
    mockPrisma.student.findFirst.mockResolvedValue({
      id: "stu_1",
      schoolId: "school_1",
      firstName: "Ada",
      lastName: "Lovelace",
      registrationNumber: "REG-1",
    });
    mockPrisma.invoice.findMany.mockResolvedValue([{ totalAmount: 1000, paidAmount: 400 }]);

    await expect(generateNoDuesCertificatePdf("school_1", "stu_1")).rejects.toThrow(/outstanding balance/i);
  });

  it("issues a certificate PDF once all non-cancelled invoices are fully paid", async () => {
    mockPrisma.student.findFirst.mockResolvedValue({
      id: "stu_1",
      schoolId: "school_1",
      firstName: "Ada",
      lastName: "Lovelace",
      registrationNumber: "REG-1",
    });
    mockPrisma.invoice.findMany.mockResolvedValue([{ totalAmount: 1000, paidAmount: 1000 }]);
    mockPrisma.school.findUniqueOrThrow.mockResolvedValue({ name: "Greenwood School", address: null });

    const { buffer, certificateNumber } = await generateNoDuesCertificatePdf("school_1", "stu_1");

    expect(buffer.length).toBeGreaterThan(0);
    expect(certificateNumber).toContain("REG-1");
  });
});
