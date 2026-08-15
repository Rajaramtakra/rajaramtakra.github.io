import { z } from "zod";
import { ACCOUNT_TYPES } from "../enums";

export const createAccountSchema = z.object({
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(150),
  type: z.enum(ACCOUNT_TYPES),
  parentId: z.string().min(1).optional(),
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

/** Mirrors the Prisma VoucherType enum. Kept local to this schema file per module convention. */
export const VOUCHER_TYPES = ["JOURNAL", "PAYMENT", "RECEIPT", "CONTRA"] as const;
export type VoucherType = (typeof VOUCHER_TYPES)[number];

export const createJournalEntrySchema = z
  .object({
    entryDate: z.coerce.date(),
    reference: z.string().max(120).optional(),
    description: z.string().min(1).max(500),
    voucherType: z.enum(VOUCHER_TYPES).default("JOURNAL"),
    lines: z
      .array(
        z.object({
          accountId: z.string().min(1),
          debit: z.coerce.number().min(0).default(0),
          credit: z.coerce.number().min(0).default(0),
        })
      )
      .min(2),
  })
  .refine(
    (entry) => {
      const totalDebit = entry.lines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = entry.lines.reduce((sum, l) => sum + l.credit, 0);
      return Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0;
    },
    { message: "Journal entry lines must balance: total debits must equal total credits" }
  );
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;

/** Mirrors the Prisma IncomeExpenseKind enum. */
export const INCOME_EXPENSE_KINDS = ["INCOME", "EXPENSE"] as const;
export type IncomeExpenseKind = (typeof INCOME_EXPENSE_KINDS)[number];

export const createIncomeExpenseTypeSchema = z.object({
  name: z.string().min(1).max(100),
  kind: z.enum(INCOME_EXPENSE_KINDS),
  accountId: z.string().min(1).optional(),
});
export type CreateIncomeExpenseTypeInput = z.infer<typeof createIncomeExpenseTypeSchema>;

export const createCashBookEntrySchema = z
  .object({
    date: z.coerce.date(),
    description: z.string().min(1).max(300),
    debit: z.coerce.number().min(0).default(0),
    credit: z.coerce.number().min(0).default(0),
  })
  .refine((e) => e.debit > 0 || e.credit > 0, { message: "Provide either a debit or a credit amount" });
export type CreateCashBookEntryInput = z.infer<typeof createCashBookEntrySchema>;

export const createBankAccountSchema = z.object({
  bankName: z.string().min(1).max(150),
  accountNumber: z.string().min(1).max(60),
  accountId: z.string().min(1),
});
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
