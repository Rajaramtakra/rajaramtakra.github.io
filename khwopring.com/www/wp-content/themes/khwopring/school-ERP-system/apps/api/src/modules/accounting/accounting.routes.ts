import { Router } from "express";
import {
  createAccountSchema,
  createBankAccountSchema,
  createCashBookEntrySchema,
  createIncomeExpenseTypeSchema,
  createJournalEntrySchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./accounting.controller";

export const accountingRouter = Router();
accountingRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Accounting
 *   description: Chart of accounts, journal entries, cash book, and bank accounts
 */

// --- Chart of Accounts ---

accountingRouter.get("/accounts", requirePermission("accounting:read", "accounting:manage"), controller.listAccounts);
accountingRouter.post(
  "/accounts",
  requirePermission("accounting:manage"),
  validateBody(createAccountSchema),
  controller.createAccount
);
accountingRouter.get("/accounts/:id", requirePermission("accounting:read", "accounting:manage"), controller.getAccount);
accountingRouter.patch(
  "/accounts/:id",
  requirePermission("accounting:manage"),
  validateBody(createAccountSchema.partial()),
  controller.updateAccount
);
accountingRouter.delete("/accounts/:id", requirePermission("accounting:manage"), controller.deleteAccount);
accountingRouter.get(
  "/accounts/:id/ledger",
  requirePermission("accounting:read", "accounting:manage"),
  controller.getAccountLedger
);

// --- Journal Entries (append-only: create + read only, no update/delete) ---

accountingRouter.get(
  "/journal-entries",
  requirePermission("accounting:read", "accounting:manage"),
  controller.listJournalEntries
);
accountingRouter.post(
  "/journal-entries",
  requirePermission("accounting:manage"),
  validateBody(createJournalEntrySchema),
  controller.createJournalEntry
);
accountingRouter.get(
  "/journal-entries/:id",
  requirePermission("accounting:read", "accounting:manage"),
  controller.getJournalEntry
);
accountingRouter.get(
  "/journal-entries/:id/pdf",
  requirePermission("accounting:read", "accounting:manage"),
  controller.downloadJournalEntryPdf
);

// --- Bank Accounts ---

accountingRouter.get(
  "/bank-accounts",
  requirePermission("accounting:read", "accounting:manage"),
  controller.listBankAccounts
);
accountingRouter.post(
  "/bank-accounts",
  requirePermission("accounting:manage"),
  validateBody(createBankAccountSchema),
  controller.createBankAccount
);
accountingRouter.get(
  "/bank-accounts/:id/reconciliation",
  requirePermission("accounting:read", "accounting:manage"),
  controller.getBankAccountReconciliation
);

// --- Cash Book ---

accountingRouter.get(
  "/cash-book",
  requirePermission("accounting:read", "accounting:manage"),
  controller.listCashBookEntries
);
accountingRouter.post(
  "/cash-book",
  requirePermission("accounting:manage"),
  validateBody(createCashBookEntrySchema),
  controller.createCashBookEntry
);

// --- Income / Expense Types ---

accountingRouter.get(
  "/income-expense-types",
  requirePermission("accounting:read", "accounting:manage"),
  controller.listIncomeExpenseTypes
);
accountingRouter.post(
  "/income-expense-types",
  requirePermission("accounting:manage"),
  validateBody(createIncomeExpenseTypeSchema),
  controller.createIncomeExpenseType
);
