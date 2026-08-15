import type { Request, Response } from "express";
import * as accountingService from "./accounting.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

function parseDateRange(query: Record<string, string | undefined>) {
  return {
    startDate: query.startDate ? new Date(query.startDate) : undefined,
    endDate: query.endDate ? new Date(query.endDate) : undefined,
  };
}

// --- Chart of Accounts ---

export const listAccounts = asyncHandler(async (req: Request, res: Response) => {
  const accounts = await accountingService.listAccounts(req.user!.schoolId);
  res.json({ accounts });
});

export const getAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountingService.getAccount(req.user!.schoolId, req.params.id);
  res.json({ account });
});

export const createAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountingService.createAccount(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_ACCOUNT", resource: "account", resourceId: account.id });
  res.status(201).json({ account });
});

export const updateAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountingService.updateAccount(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_ACCOUNT", resource: "account", resourceId: account.id });
  res.json({ account });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  await accountingService.deleteAccount(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "DELETE_ACCOUNT", resource: "account", resourceId: req.params.id });
  res.status(204).send();
});

export const getAccountLedger = asyncHandler(async (req: Request, res: Response) => {
  const ledger = await accountingService.getAccountLedger(req.user!.schoolId, req.params.id);
  res.json(ledger);
});

// --- Journal Entries ---

export const listJournalEntries = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = parseDateRange(req.query as Record<string, string | undefined>);
  const entries = await accountingService.listJournalEntries(req.user!.schoolId, { startDate, endDate });
  res.json({ journalEntries: entries });
});

export const getJournalEntry = asyncHandler(async (req: Request, res: Response) => {
  const entry = await accountingService.getJournalEntry(req.user!.schoolId, req.params.id);
  res.json({ journalEntry: entry });
});

export const createJournalEntry = asyncHandler(async (req: Request, res: Response) => {
  const entry = await accountingService.createJournalEntry(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "POST_JOURNAL_ENTRY", resource: "journal_entry", resourceId: entry.id });
  res.status(201).json({ journalEntry: entry });
});

export const downloadJournalEntryPdf = asyncHandler(async (req: Request, res: Response) => {
  const { buffer, voucherNumber } = await accountingService.getJournalEntryPdf(req.user!.schoolId, req.params.id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${voucherNumber}.pdf"`);
  res.send(buffer);
});

// --- Bank Accounts ---

export const listBankAccounts = asyncHandler(async (req: Request, res: Response) => {
  const bankAccounts = await accountingService.listBankAccounts(req.user!.schoolId);
  res.json({ bankAccounts });
});

export const createBankAccount = asyncHandler(async (req: Request, res: Response) => {
  const bankAccount = await accountingService.createBankAccount(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_BANK_ACCOUNT", resource: "bank_account", resourceId: bankAccount.id });
  res.status(201).json({ bankAccount });
});

export const getBankAccountReconciliation = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = parseDateRange(req.query as Record<string, string | undefined>);
  const reconciliation = await accountingService.getBankAccountReconciliation(req.user!.schoolId, req.params.id, {
    startDate,
    endDate,
  });
  res.json(reconciliation);
});

// --- Cash Book ---

export const listCashBookEntries = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = parseDateRange(req.query as Record<string, string | undefined>);
  const cashBookEntries = await accountingService.listCashBookEntries(req.user!.schoolId, { startDate, endDate });
  res.json({ cashBookEntries });
});

export const createCashBookEntry = asyncHandler(async (req: Request, res: Response) => {
  const cashBookEntry = await accountingService.createCashBookEntry(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_CASH_BOOK_ENTRY", resource: "cash_book_entry", resourceId: cashBookEntry.id });
  res.status(201).json({ cashBookEntry });
});

// --- Income / Expense Types ---

export const listIncomeExpenseTypes = asyncHandler(async (req: Request, res: Response) => {
  const incomeExpenseTypes = await accountingService.listIncomeExpenseTypes(req.user!.schoolId);
  res.json({ incomeExpenseTypes });
});

export const createIncomeExpenseType = asyncHandler(async (req: Request, res: Response) => {
  const incomeExpenseType = await accountingService.createIncomeExpenseType(req.user!.schoolId, req.body);
  await recordAudit({
    req,
    action: "CREATE_INCOME_EXPENSE_TYPE",
    resource: "income_expense_type",
    resourceId: incomeExpenseType.id,
  });
  res.status(201).json({ incomeExpenseType });
});
