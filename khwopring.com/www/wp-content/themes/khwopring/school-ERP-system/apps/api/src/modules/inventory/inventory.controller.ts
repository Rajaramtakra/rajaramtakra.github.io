import type { Request, Response } from "express";
import * as assetService from "./asset.service";
import * as stockService from "./stock.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

// =========================================================================
// Assets
// =========================================================================

export const listAssets = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search, category } = req.query as Record<string, string>;
  const result = await assetService.listAssets(req.user!.schoolId, { page: Number(page), pageSize: Number(pageSize), search }, { category });
  res.json(result);
});

export const getAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await assetService.getAsset(req.user!.schoolId, req.params.id);
  res.json({ asset });
});

export const createAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await assetService.createAsset(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_ASSET", resource: "asset", resourceId: asset.id });
  res.status(201).json({ asset });
});

export const updateAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await assetService.updateAsset(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_ASSET", resource: "asset", resourceId: asset.id });
  res.json({ asset });
});

export const deleteAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await assetService.deleteAsset(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "DELETE_ASSET", resource: "asset", resourceId: asset.id });
  res.json({ asset });
});

// =========================================================================
// Inventory items
// =========================================================================

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search, category, lowStockOnly } = req.query as Record<string, string>;
  const result = await stockService.listItems(
    req.user!.schoolId,
    { page: Number(page), pageSize: Number(pageSize), search },
    { category, lowStockOnly: lowStockOnly === "true" }
  );
  res.json(result);
});

export const getItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await stockService.getItem(req.user!.schoolId, req.params.id);
  res.json({ item });
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await stockService.createItem(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_INVENTORY_ITEM", resource: "inventory_item", resourceId: item.id });
  res.status(201).json({ item });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await stockService.updateItem(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_INVENTORY_ITEM", resource: "inventory_item", resourceId: item.id });
  res.json({ item });
});

export const listItemMovements = asyncHandler(async (req: Request, res: Response) => {
  const movements = await stockService.listMovementsForItem(req.user!.schoolId, req.params.id);
  res.json({ movements });
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const item = await stockService.adjustStock(req.user!.schoolId, req.body);
  await recordAudit({
    req,
    action: "ADJUST_STOCK",
    resource: "inventory_item",
    resourceId: item.id,
    metadata: { type: req.body.type, quantity: req.body.quantity, reason: req.body.reason },
  });
  res.json({ item });
});

// =========================================================================
// Vendors
// =========================================================================

export const listVendors = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search } = req.query as Record<string, string>;
  const result = await stockService.listVendors(req.user!.schoolId, { page: Number(page), pageSize: Number(pageSize), search });
  res.json(result);
});

export const getVendor = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await stockService.getVendor(req.user!.schoolId, req.params.id);
  res.json({ vendor });
});

export const createVendor = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await stockService.createVendor(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_VENDOR", resource: "vendor", resourceId: vendor.id });
  res.status(201).json({ vendor });
});

export const updateVendor = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await stockService.updateVendor(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_VENDOR", resource: "vendor", resourceId: vendor.id });
  res.json({ vendor });
});

// =========================================================================
// Purchase orders
// =========================================================================

export const listPurchaseOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, vendorId, status } = req.query as Record<string, string>;
  const result = await stockService.listPurchaseOrders(
    req.user!.schoolId,
    { page: Number(page), pageSize: Number(pageSize) },
    { vendorId, status: status as never }
  );
  res.json(result);
});

export const getPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const purchaseOrder = await stockService.getPurchaseOrder(req.user!.schoolId, req.params.id);
  res.json({ purchaseOrder });
});

export const createPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const purchaseOrder = await stockService.createPurchaseOrder(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "CREATE_PURCHASE_ORDER", resource: "purchase_order", resourceId: purchaseOrder.id });
  res.status(201).json({ purchaseOrder });
});

export const approvePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const purchaseOrder = await stockService.approvePurchaseOrder(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "APPROVE_PURCHASE_ORDER", resource: "purchase_order", resourceId: purchaseOrder.id });
  res.json({ purchaseOrder });
});

export const receivePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const purchaseOrder = await stockService.receivePurchaseOrder(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "RECEIVE_PURCHASE_ORDER", resource: "purchase_order", resourceId: purchaseOrder.id });
  res.json({ purchaseOrder });
});

export const cancelPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const purchaseOrder = await stockService.cancelPurchaseOrder(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "CANCEL_PURCHASE_ORDER", resource: "purchase_order", resourceId: purchaseOrder.id });
  res.json({ purchaseOrder });
});
