import { Router } from "express";
import { generateInvoiceSchema, collectPaymentSchema } from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./invoice.controller";

export const invoiceRouter = Router();
invoiceRouter.use(requireAuth);

const collectPaymentBodySchema = collectPaymentSchema.omit({ invoiceId: true });

/**
 * @openapi
 * tags:
 *   name: Invoices
 *   description: Student fee invoices, generated from fee structures with discounts/scholarships applied
 */

invoiceRouter.get("/", requirePermission("invoice:manage", "fee:read_own"), controller.listInvoices);

invoiceRouter.post(
  "/",
  requirePermission("invoice:manage"),
  validateBody(generateInvoiceSchema),
  controller.generateInvoice
);

invoiceRouter.get(
  "/students/:id/ledger",
  requirePermission("invoice:manage", "fee:read_own"),
  controller.getStudentLedger
);

invoiceRouter.get(
  "/students/:id/no-dues-certificate/pdf",
  requirePermission("invoice:manage", "fee:read_own"),
  controller.downloadNoDuesCertificate
);

invoiceRouter.get("/:id", requirePermission("invoice:manage", "fee:read_own"), controller.getInvoice);

invoiceRouter.get("/:id/pdf", requirePermission("invoice:manage", "fee:read_own"), controller.downloadInvoicePdf);

invoiceRouter.post("/:id/cancel", requirePermission("invoice:manage"), controller.cancelInvoice);

invoiceRouter.get(
  "/:id/payments",
  requirePermission("invoice:manage", "payment:read_own", "fee:read_own"),
  controller.listPayments
);

invoiceRouter.post(
  "/:id/payments",
  requirePermission("payment:collect"),
  validateBody(collectPaymentBodySchema),
  controller.collectPayment
);
