import { api } from "@/lib/api";
import type {
  CreateAccountInput,
  CreateBankAccountInput,
  CreateCashBookEntryInput,
  CreateIncomeExpenseTypeInput,
  CreateJournalEntryInput,
} from "@erp/shared";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId?: string | null;
  createdAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  account: { id: string; code: string; name: string };
}

export type VoucherType = "JOURNAL" | "PAYMENT" | "RECEIPT" | "CONTRA";

export interface JournalEntry {
  id: string;
  entryDate: string;
  reference?: string | null;
  description: string;
  voucherType: VoucherType;
  voucherNumber?: string | null;
  createdById: string;
  lines: JournalLine[];
}

export interface IncomeExpenseType {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  accountId?: string | null;
  account?: { id: string; code: string; name: string } | null;
}

export interface AccountLedgerEntry {
  id: string;
  journalEntryId: string;
  entryDate: string;
  reference?: string | null;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AccountLedger {
  account: Account;
  entries: AccountLedgerEntry[];
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountId: string;
  account: { id: string; code: string; name: string };
}

export interface CashBookEntry {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface BankReconciliation {
  bankAccount: BankAccount;
  journalLines: (JournalLine & { journalEntry: { entryDate: string; reference?: string | null; description: string } })[];
  cashBookEntries: CashBookEntry[];
}

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export const accountingApi = {
  // Chart of Accounts
  listAccounts: () => api.get<{ accounts: Account[] }>("/accounting/accounts").then((r) => r.data.accounts),
  getAccount: (id: string) => api.get<{ account: Account }>(`/accounting/accounts/${id}`).then((r) => r.data.account),
  createAccount: (data: CreateAccountInput) =>
    api.post<{ account: Account }>("/accounting/accounts", data).then((r) => r.data.account),
  updateAccount: (id: string, data: Partial<CreateAccountInput>) =>
    api.patch<{ account: Account }>(`/accounting/accounts/${id}`, data).then((r) => r.data.account),
  deleteAccount: (id: string) => api.delete(`/accounting/accounts/${id}`),
  getAccountLedger: (id: string) => api.get<AccountLedger>(`/accounting/accounts/${id}/ledger`).then((r) => r.data),

  // Journal Entries
  listJournalEntries: (params?: DateRangeParams) =>
    api.get<{ journalEntries: JournalEntry[] }>("/accounting/journal-entries", { params }).then((r) => r.data.journalEntries),
  getJournalEntry: (id: string) =>
    api.get<{ journalEntry: JournalEntry }>(`/accounting/journal-entries/${id}`).then((r) => r.data.journalEntry),
  createJournalEntry: (data: CreateJournalEntryInput) =>
    api.post<{ journalEntry: JournalEntry }>("/accounting/journal-entries", data).then((r) => r.data.journalEntry),
  downloadJournalEntryPdf: (id: string) =>
    api.get(`/accounting/journal-entries/${id}/pdf`, { responseType: "blob" }).then((r) => r.data as Blob),

  // Bank Accounts
  listBankAccounts: () => api.get<{ bankAccounts: BankAccount[] }>("/accounting/bank-accounts").then((r) => r.data.bankAccounts),
  createBankAccount: (data: CreateBankAccountInput) =>
    api.post<{ bankAccount: BankAccount }>("/accounting/bank-accounts", data).then((r) => r.data.bankAccount),
  getBankAccountReconciliation: (id: string, params?: DateRangeParams) =>
    api.get<BankReconciliation>(`/accounting/bank-accounts/${id}/reconciliation`, { params }).then((r) => r.data),

  // Cash Book
  listCashBookEntries: (params?: DateRangeParams) =>
    api.get<{ cashBookEntries: CashBookEntry[] }>("/accounting/cash-book", { params }).then((r) => r.data.cashBookEntries),
  createCashBookEntry: (data: CreateCashBookEntryInput) =>
    api.post<{ cashBookEntry: CashBookEntry }>("/accounting/cash-book", data).then((r) => r.data.cashBookEntry),

  // Income / Expense Types
  listIncomeExpenseTypes: () =>
    api.get<{ incomeExpenseTypes: IncomeExpenseType[] }>("/accounting/income-expense-types").then((r) => r.data.incomeExpenseTypes),
  createIncomeExpenseType: (data: CreateIncomeExpenseTypeInput) =>
    api
      .post<{ incomeExpenseType: IncomeExpenseType }>("/accounting/income-expense-types", data)
      .then((r) => r.data.incomeExpenseType),
};
