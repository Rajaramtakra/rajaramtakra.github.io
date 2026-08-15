import { Router } from "express";
import {
  createAssetSchema,
  createInventoryItemSchema,
  createPurchaseOrderSchema,
  createVendorSchema,
  recordStockMovementSchema,
  updateAssetSchema,
  updateInventoryItemSchema,
  updateVendorSchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./inventory.controller";

export const inventoryRouter = Router();
inventoryRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Inventory
 *   description: Asset register, stock items, vendors, and purchase orders
 */

// -------------------------------------------------------------------------
// Assets
// -------------------------------------------------------------------------

inventoryRouter.get("/assets", requirePermission("inventory:read", "inventory:manage"), controller.listAssets);
inventoryRouter.post(
  "/assets",
  requirePermission("inventory:manage"),
  validateBody(createAssetSchema),
  controller.createAsset
);
inventoryRouter.get("/assets/:id", requirePermission("inventory:read", "inventory:manage"), controller.getAsset);
inventoryRouter.patch(
  "/assets/:id",
  requirePermission("inventory:manage"),
  validateBody(updateAssetSchema),
  controller.updateAsset
);
inventoryRouter.delete("/assets/:id", requirePermission("inventory:manage"), controller.deleteAsset);

// -------------------------------------------------------------------------
// Inventory items + stock ledger
// -------------------------------------------------------------------------

inventoryRouter.get("/items", requirePermission("inventory:read", "inventory:manage"), controller.listItems);
inventoryRouter.post(
  "/items",
  requirePermission("inventory:manage"),
  validateBody(createInventoryItemSchema),
  controller.createItem
);
inventoryRouter.get("/items/:id", requirePermission("inventory:read", "inventory:manage"), controller.getItem);
inventoryRouter.patch(
  "/items/:id",
  requirePermission("inventory:manage"),
  validateBody(updateInventoryItemSchema),
  controller.updateItem
);
inventoryRouter.get(
  "/items/:id/movements",
  requirePermission("inventory:read", "inventory:manage"),
  controller.listItemMovements
);

inventoryRouter.post(
  "/stock-movements",
  requirePermission("inventory:manage"),
  validateBody(recordStockMovementSchema),
  controller.adjustStock
);

// -------------------------------------------------------------------------
// Vendors
// -------------------------------------------------------------------------

inventoryRouter.get("/vendors", requirePermission("inventory:read", "inventory:manage"), controller.listVendors);
inventoryRouter.post(
  "/vendors",
  requirePermission("inventory:manage"),
  validateBody(createVendorSchema),
  controller.createVendor
);
inventoryRouter.get("/vendors/:id", requirePermission("inventory:read", "inventory:manage"), controller.getVendor);
inventoryRouter.patch(
  "/vendors/:id",
  requirePermission("inventory:manage"),
  validateBody(updateVendorSchema),
  controller.updateVendor
);

// -------------------------------------------------------------------------
// Purchase orders
// -------------------------------------------------------------------------

inventoryRouter.get(
  "/purchase-orders",
  requirePermission("inventory:read", "inventory:manage"),
  controller.listPurchaseOrders
);
inventoryRouter.post(
  "/purchase-orders",
  requirePermission("inventory:manage"),
  validateBody(createPurchaseOrderSchema),
  controller.createPurchaseOrder
);
inventoryRouter.get(
  "/purchase-orders/:id",
  requirePermission("inventory:read", "inventory:manage"),
  controller.getPurchaseOrder
);
inventoryRouter.post(
  "/purchase-orders/:id/approve",
  requirePermission("inventory:manage"),
  controller.approvePurchaseOrder
);
inventoryRouter.post(
  "/purchase-orders/:id/receive",
  requirePermission("inventory:manage"),
  controller.receivePurchaseOrder
);
inventoryRouter.post(
  "/purchase-orders/:id/cancel",
  requirePermission("inventory:manage"),
  controller.cancelPurchaseOrder
);
