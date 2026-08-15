import type {
  CreateAccountInput,
  CreateBankAccountInput,
  CreateCashBookEntryInput,
  CreateIncomeExpenseTypeInput,
  CreateJournalEntryInput,
} from "@erp/shared";
import type { AccountType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors";
import { generateVoucherNumber } from "./voucher.numbering";
import { generateVoucherPdf } from "./voucher.pdf";

// =========================================================================
// Chart of Accounts
// =========================================================================

export function listAccounts(schoolId: string) {
  return prisma.account.findMany({
    where: { schoolId, deletedAt: null },
    orderBy: [{ code: "asc" }],
  });
}

async function findAccountOrThrow(schoolId: string, id: string) {
  const account = await prisma.account.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!account) throw new NotFoundError("Account not found");
  return account;
}

export async function getAccount(schoolId: string, id: string) {
  return findAccountOrThrow(schoolId, id);
}

export async function createAccount(schoolId: string, input: CreateAccountInput) {
  if (input.parentId) {
    await findAccountOrThrow(schoolId, input.parentId);
  }
  const existing = await prisma.account.findFirst({ where: { schoolId, code: input.code, deletedAt: null } });
  if (existing) throw new ConflictError(`Account code "${input.code}" already exists`);

  return prisma.account.create({ data: { schoolId, ...input } });
}

export async function updateAccount(schoolId: string, id: string, input: Partial<CreateAccountInput>) {
  await findAccountOrThrow(schoolId, id);

  if (input.parentId) {
    if (input.parentId === id) throw new BadRequestError("An account cannot be its own parent");
    await findAccountOrThrow(schoolId, input.parentId);
  }

  if (input.code) {
    const existing = await prisma.account.findFirst({
      where: { schoolId, code: input.code, deletedAt: null, NOT: { id } },
    });
    if (existing) throw new ConflictError(`Account code "${input.code}" already exists`);
  }

  return prisma.account.update({ where: { id }, data: input });
}

export async function deleteAccount(schoolId: string, id: string) {
  await findAccountOrThrow(schoolId, id);

  const [childCount, lineCount] = await Promise.all([
    prisma.account.count({ where: { parentId: id, deletedAt: null } }),
    prisma.journalLine.count({ where: { accountId: id } }),
  ]);
  if (childCount > 0) throw new ConflictError("Cannot delete an account that has child accounts");
  if (lineCount > 0) throw new ConflictError("Cannot delete an account that has posted journal lines");

  return prisma.account.update({ where: { id }, data: { deletedAt: new Date() } });
}

/**
 * Running ledger balance for a single account, computed from posted journal lines.
 * ASSET/EXPENSE accounts increase on debit; LIABILITY/EQUITY/INCOME accounts increase on credit.
 */
export function computeRunningBalance(
  type: AccountType,
  lines: { debit: number; credit: number }[]
): { debit: number; credit: number; balance: number }[] {
  const debitIncreases = type === "ASSET" || type === "EXPENSE";
  let balance = 0;
  return lines.map((line) => {
    balance += debitIncreases ? line.debit - line.credit : line.credit - line.debit;
    return { debit: line.debit, credit: line.credit, balance };
  });
}

export async function getAccountLedger(schoolId: string, id: string) {
  const account = await findAccountOrThrow(schoolId, id);

  const lines = await prisma.journalLine.findMany({
    where: { accountId: id, journalEntry: { schoolId } },
    include: { journalEntry: true },
    orderBy: { journalEntry: { entryDate: "asc" } },
  });

  const running = computeRunningBalance(
    account.type,
    lines.map((l) => ({ debit: Number(l.debit), credit: Number(l.credit) }))
  );

  return {
    account,
    entries: lines.map((line, i) => ({
      id: line.id,
      journalEntryId: line.journalEntryId,
      entryDate: line.journalEntry.entryDate,
      reference: line.journalEntry.reference,
      description: line.journalEntry.description,
      debit: running[i].debit,
      credit: running[i].credit,
      balance: running[i].balance,
    })),
  };
}

// =========================================================================
// Journal Entries (append-only ledger — no update/delete, only new entries)
// =========================================================================

export function listJournalEntries(schoolId: string, filters: { startDate?: Date; endDate?: Date } = {}) {
  return prisma.journalEntry.findMany({
    where: {
      schoolId,
      ...(filters.startDate || filters.endDate
        ? {
            entryDate: {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          }
        : {}),
    },
    include: { lines: { include: { account: true } } },
    orderBy: { entryDate: "desc" },
  });
}

export async function getJournalEntry(schoolId: string, id: string) {
  const entry = await prisma.journalEntry.findFirst({
    where: { id, schoolId },
    include: { lines: { include: { account: true } } },
  });
  if (!entry) throw new NotFoundError("Journal entry not found");
  return entry;
}

export async function createJournalEntry(schoolId: string, createdById: string, input: CreateJournalEntryInput) {
  const accountIds = [...new Set(input.lines.map((l) => l.accountId))];
  const accounts = await prisma.account.findMany({ where: { id: { in: accountIds }, schoolId, deletedAt: null } });
  if (accounts.length !== accountIds.length) {
    throw new BadRequestError("One or more accounts were not found in this school");
  }

  const voucherNumber =
    input.voucherType === "JOURNAL" ? undefined : await generateVoucherNumber(schoolId, input.voucherType);

  return prisma.journalEntry.create({
    data: {
      schoolId,
      entryDate: input.entryDate,
      reference: input.reference,
      description: input.description,
      voucherType: input.voucherType,
      voucherNumber,
      createdById,
      lines: { create: input.lines.map((l) => ({ accountId: l.accountId, debit: l.debit, credit: l.credit })) },
    },
    include: { lines: { include: { account: true } } },
  });
}

export async function getJournalEntryPdf(schoolId: string, id: string) {
  const entry = await getJournalEntry(schoolId, id);
  const school = await prisma.school.findUniqueOrThrow({ where: { id: schoolId } });

  const buffer = await generateVoucherPdf({
    school: { name: school.name, address: school.address, phone: school.phone, email: school.email },
    voucherType: entry.voucherType,
    voucherNumber: entry.voucherNumber ?? entry.id,
    entryDate: entry.entryDate,
    reference: entry.reference,
    description: entry.description,
    lines: entry.lines.map((l) => ({ accountName: l.account.name, debit: Number(l.debit), credit: Number(l.credit) })),
  });

  return { buffer, voucherNumber: entry.voucherNumber ?? entry.id };
}

// =========================================================================
// Bank Accounts
// =========================================================================

export function listBankAccounts(schoolId: string) {
  return prisma.bankAccount.findMany({ where: { schoolId }, include: { account: true }, orderBy: { bankName: "asc" } });
}

export async function createBankAccount(schoolId: string, input: CreateBankAccountInput) {
  await findAccountOrThrow(schoolId, input.accountId);
  return prisma.bankAccount.create({ data: { schoolId, ...input }, include: { account: true } });
}

/** Manual reconciliation view: linked ledger lines + school cash book entries for a date range. */
export async function getBankAccountReconciliation(
  schoolId: string,
  id: string,
  range: { startDate?: Date; endDate?: Date } = {}
) {
  const bankAccount = await prisma.bankAccount.findFirst({ where: { id, schoolId }, include: { account: true } });
  if (!bankAccount) throw new NotFoundError("Bank account not found");

  const dateFilter =
    range.startDate || range.endDate
      ? { gte: range.startDate, lte: range.endDate }
      : undefined;

  const [journalLines, cashBookEntries] = await Promise.all([
    prisma.journalLine.findMany({
      where: {
        accountId: bankAccount.accountId,
        journalEntry: { schoolId, ...(dateFilter ? { entryDate: dateFilter } : {}) },
      },
      include: { journalEntry: true },
      orderBy: { journalEntry: { entryDate: "asc" } },
    }),
    prisma.cashBookEntry.findMany({
      where: { schoolId, ...(dateFilter ? { date: dateFilter } : {}) },
      orderBy: { date: "asc" },
    }),
  ]);

  return { bankAccount, journalLines, cashBookEntries };
}

// =========================================================================
// Cash Book
// =========================================================================

export function listCashBookEntries(schoolId: string, filters: { startDate?: Date; endDate?: Date } = {}) {
  return prisma.cashBookEntry.findMany({
    where: {
      schoolId,
      ...(filters.startDate || filters.endDate
        ? {
            date: {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
}

/** Computes the new denormalized balance from the most recent prior entry; never trusts client input. */
export function computeNextCashBookBalance(priorBalance: number, debit: number, credit: number) {
  return priorBalance + debit - credit;
}

export async function createCashBookEntry(schoolId: string, input: CreateCashBookEntryInput) {
  const prior = await prisma.cashBookEntry.findFirst({
    where: { schoolId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  const priorBalance = prior ? Number(prior.balance) : 0;
  const balance = computeNextCashBookBalance(priorBalance, input.debit, input.credit);

  return prisma.cashBookEntry.create({
    data: {
      schoolId,
      date: input.date,
      description: input.description,
      debit: input.debit,
      credit: input.credit,
      balance,
    },
  });
}

// =========================================================================
// Income / Expense Type master
// =========================================================================

export function listIncomeExpenseTypes(schoolId: string) {
  return prisma.incomeExpenseType.findMany({ where: { schoolId }, include: { account: true }, orderBy: { name: "asc" } });
}

export async function createIncomeExpenseType(schoolId: string, input: CreateIncomeExpenseTypeInput) {
  if (input.accountId) await findAccountOrThrow(schoolId, input.accountId);

  const existing = await prisma.incomeExpenseType.findFirst({ where: { schoolId, name: input.name } });
  if (existing) throw new ConflictError(`An income/expense type named "${input.name}" already exists`);

  return prisma.incomeExpenseType.create({ data: { schoolId, ...input }, include: { account: true } });
}
