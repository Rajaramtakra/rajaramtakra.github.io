import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  account: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  journalLine: { findMany: vi.fn(), count: vi.fn() },
  journalEntry: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), count: vi.fn() },
  bankAccount: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  cashBookEntry: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  incomeExpenseType: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  computeNextCashBookBalance,
  computeRunningBalance,
  createCashBookEntry,
  createIncomeExpenseType,
  createJournalEntry,
  getAccountLedger,
} from "../../src/modules/accounting/accounting.service";

describe("accounting.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeRunningBalance", () => {
    it("increases an ASSET account's balance on debit and decreases on credit", () => {
      const result = computeRunningBalance("ASSET", [
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 300 },
      ]);
      expect(result.map((r) => r.balance)).toEqual([1000, 700]);
    });

    it("increases a LIABILITY account's balance on credit and decreases on debit (opposite of ASSET)", () => {
      const result = computeRunningBalance("LIABILITY", [
        { debit: 0, credit: 1000 },
        { debit: 300, credit: 0 },
      ]);
      expect(result.map((r) => r.balance)).toEqual([1000, 700]);
    });

    it("treats EXPENSE like ASSET (debit increases)", () => {
      const result = computeRunningBalance("EXPENSE", [{ debit: 500, credit: 0 }]);
      expect(result[0].balance).toBe(500);
    });

    it("treats INCOME and EQUITY like LIABILITY (credit increases)", () => {
      const income = computeRunningBalance("INCOME", [{ debit: 0, credit: 500 }]);
      const equity = computeRunningBalance("EQUITY", [{ debit: 0, credit: 500 }]);
      expect(income[0].balance).toBe(500);
      expect(equity[0].balance).toBe(500);
    });
  });

  describe("getAccountLedger", () => {
    it("branches the running balance formula on the account's type", async () => {
      mockPrisma.account.findFirst.mockResolvedValue({ id: "acc_1", schoolId: "school_1", type: "LIABILITY" });
      mockPrisma.journalLine.findMany.mockResolvedValue([
        {
          id: "line_1",
          journalEntryId: "je_1",
          debit: 0,
          credit: 200,
          journalEntry: { entryDate: new Date("2026-01-01"), reference: "R1", description: "Opening" },
        },
        {
          id: "line_2",
          journalEntryId: "je_2",
          debit: 50,
          credit: 0,
          journalEntry: { entryDate: new Date("2026-01-02"), reference: "R2", description: "Payment" },
        },
      ]);

      const ledger = await getAccountLedger("school_1", "acc_1");

      expect(ledger.entries.map((e) => e.balance)).toEqual([200, 150]);
    });
  });

  describe("computeNextCashBookBalance", () => {
    it("adds the debit and subtracts the credit from the prior balance", () => {
      expect(computeNextCashBookBalance(1000, 500, 0)).toBe(1500);
      expect(computeNextCashBookBalance(1000, 0, 300)).toBe(700);
    });
  });

  describe("createCashBookEntry", () => {
    it("computes the new balance from the most recent prior entry rather than trusting client input", async () => {
      mockPrisma.cashBookEntry.findFirst.mockResolvedValue({ id: "cbe_1", balance: 2000 });
      mockPrisma.cashBookEntry.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "cbe_2", ...data })
      );

      const entry = await createCashBookEntry("school_1", {
        date: new Date("2026-02-01"),
        description: "Office supplies",
        debit: 0,
        credit: 250,
      });

      expect(mockPrisma.cashBookEntry.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { schoolId: "school_1" } })
      );
      expect(entry.balance).toBe(1750);
    });

    it("starts from a zero balance when there is no prior entry", async () => {
      mockPrisma.cashBookEntry.findFirst.mockResolvedValue(null);
      mockPrisma.cashBookEntry.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "cbe_1", ...data })
      );

      const entry = await createCashBookEntry("school_1", {
        date: new Date("2026-01-01"),
        description: "Opening cash",
        debit: 5000,
        credit: 0,
      });

      expect(entry.balance).toBe(5000);
    });
  });

  describe("createJournalEntry - voucher numbering", () => {
    it("does not generate a voucherNumber for a plain JOURNAL entry", async () => {
      mockPrisma.account.findMany.mockResolvedValue([{ id: "acc_1" }, { id: "acc_2" }]);
      mockPrisma.journalEntry.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "je_1", ...data, lines: [] })
      );

      const entry = await createJournalEntry("school_1", "user_1", {
        entryDate: new Date("2026-01-01"),
        description: "Opening balances",
        voucherType: "JOURNAL",
        lines: [
          { accountId: "acc_1", debit: 100, credit: 0 },
          { accountId: "acc_2", debit: 0, credit: 100 },
        ],
      });

      expect(entry.voucherNumber).toBeUndefined();
      expect(mockPrisma.journalEntry.findUnique).not.toHaveBeenCalled();
    });

    it("generates a PYV-prefixed voucherNumber for a PAYMENT voucher", async () => {
      mockPrisma.account.findMany.mockResolvedValue([{ id: "acc_1" }, { id: "acc_2" }]);
      mockPrisma.journalEntry.count.mockResolvedValue(0);
      mockPrisma.journalEntry.findUnique.mockResolvedValue(null);
      mockPrisma.journalEntry.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "je_1", ...data, lines: [] })
      );

      const entry = await createJournalEntry("school_1", "user_1", {
        entryDate: new Date("2026-01-01"),
        description: "Vendor payment",
        voucherType: "PAYMENT",
        lines: [
          { accountId: "acc_1", debit: 100, credit: 0 },
          { accountId: "acc_2", debit: 0, credit: 100 },
        ],
      });

      expect(entry.voucherNumber).toMatch(/^PYV-\d{4}-\d{5}$/);
    });
  });

  describe("createIncomeExpenseType", () => {
    it("rejects a duplicate name within the same school", async () => {
      mockPrisma.incomeExpenseType.findFirst.mockResolvedValue({ id: "iet_1", name: "Tuition Fee" });

      await expect(
        createIncomeExpenseType("school_1", { name: "Tuition Fee", kind: "INCOME" })
      ).rejects.toThrow(/already exists/i);

      expect(mockPrisma.incomeExpenseType.create).not.toHaveBeenCalled();
    });

    it("validates the linked account belongs to this school before creating", async () => {
      mockPrisma.incomeExpenseType.findFirst.mockResolvedValue(null);
      mockPrisma.account.findFirst.mockResolvedValue(null);

      await expect(
        createIncomeExpenseType("school_1", { name: "Stationery", kind: "EXPENSE", accountId: "acc_missing" })
      ).rejects.toThrow(/not found/i);
    });
  });
});
