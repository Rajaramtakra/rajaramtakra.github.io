import type { Request, Response } from "express";
import * as invoiceService from "./invoice.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const generateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.generateInvoice(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "GENERATE_INVOICE", resource: "invoice", resourceId: invoice.id });
  res.status(201).json({ invoice });
});

export const listInvoices = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, studentId, status } = req.query as Record<string, string>;
  const result = await invoiceService.listInvoicesForCaller(
    req.user!.schoolId,
    { userId: req.user!.id, permissions: req.user!.permissions },
    { page: Number(page) || undefined, pageSize: Number(pageSize) || undefined },
    { studentId, status }
  );
  res.json(result);
});

export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceForCaller(
    req.user!.schoolId,
    { userId: req.user!.id, permissions: req.user!.permissions },
    req.params.id
  );
  res.json({ invoice });
});

export const downloadInvoicePdf = asyncHandler(async (req: Request, res: Response) => {
  const { buffer, invoiceNumber } = await invoiceService.getInvoicePdf(
    req.user!.schoolId,
    { userId: req.user!.id, permissions: req.user!.permissions },
    req.params.id
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${invoiceNumber}.pdf"`);
  res.send(buffer);
});

export const getStudentLedger = asyncHandler(async (req: Request, res: Response) => {
  const ledger = await invoiceService.getStudentLedgerForCaller(
    req.user!.schoolId,
    { userId: req.user!.id, permissions: req.user!.permissions },
    req.params.id
  );
  res.json(ledger);
});

export const downloadNoDuesCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { buffer, certificateNumber } = await invoiceService.generateNoDuesCertificatePdf(
    req.user!.schoolId,
    req.params.id
  );
  await recordAudit({ req, action: "ISSUE_NO_DUES_CERTIFICATE", resource: "student", resourceId: req.params.id });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${certificateNumber}.pdf"`);
  res.send(buffer);
});

export const cancelInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.cancelInvoice(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "CANCEL_INVOICE", resource: "invoice", resourceId: invoice.id });
  res.json({ invoice });
});

export const collectPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await invoiceService.collectPayment(req.user!.schoolId, req.user!.id, {
    ...req.body,
    invoiceId: req.params.id,
  });
  await recordAudit({ req, action: "COLLECT_PAYMENT", resource: "payment", resourceId: result.payment.id });
  res.status(201).json(result);
});

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const payments = await invoiceService.listPaymentsForInvoice(req.user!.schoolId, req.params.id);
  res.json({ payments });
});
