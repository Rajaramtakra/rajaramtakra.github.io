import type { Request, Response } from "express";
import * as posService from "./pos.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const createSale = asyncHandler(async (req: Request, res: Response) => {
  const sale = await posService.createSale(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "CREATE_SALE", resource: "sale", resourceId: sale.id });
  res.status(201).json({ sale });
});

export const listSales = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as Record<string, string>;
  const sales = await posService.listSales(req.user!.schoolId, { status: status as never });
  res.json({ sales });
});

export const getSale = asyncHandler(async (req: Request, res: Response) => {
  const sale = await posService.getSale(req.user!.schoolId, req.params.id);
  res.json({ sale });
});

export const cancelSale = asyncHandler(async (req: Request, res: Response) => {
  const sale = await posService.cancelSale(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "CANCEL_SALE", resource: "sale", resourceId: sale.id });
  res.json({ sale });
});

export const collectPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await posService.collectSalePayment(req.user!.schoolId, req.user!.id, req.params.id, req.body);
  await recordAudit({ req, action: "COLLECT_SALE_PAYMENT", resource: "sale_payment", resourceId: result.payment.id });
  res.status(201).json(result);
});

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const payments = await posService.listPaymentsForSale(req.user!.schoolId, req.params.id);
  res.json({ payments });
});
