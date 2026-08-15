import { z } from "zod";

/**
 * Enum arrays local to the inventory module (kept out of the shared enums.ts per
 * cross-team coordination rules — do not move these into enums.ts).
 */
export const PURCHASE_ORDER_STATUSES = ["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export const STOCK_MOVEMENT_TYPES = ["IN", "OUT", "DAMAGE"] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

// -------------------------------------------------------------------------
// Assets
// -------------------------------------------------------------------------

export const createAssetSchema = z.object({
  name: z.string().min(1).max(150),
  category: z.string().min(1).max(100),
  purchaseDate: z.coerce.date(),
  purchaseCost: z.coerce.number().nonnegative(),
  location: z.string().max(150).optional(),
  condition: z.string().max(100).optional(),
});
export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const updateAssetSchema = createAssetSchema.partial();
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

export const assetSearchSchema = z.object({
  category: z.string().optional(),
});
export type AssetSearchInput = z.infer<typeof assetSearchSchema>;

// -------------------------------------------------------------------------
// Inventory items
// -------------------------------------------------------------------------

export const createInventoryItemSchema = z.object({
  name: z.string().min(1).max(150),
  category: z.string().min(1).max(100),
  unit: z.string().min(1).max(30),
  reorderLevel: z.coerce.number().int().min(0).default(0),
});
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

export const updateInventoryItemSchema = createInventoryItemSchema.partial();
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;

export const inventoryItemSearchSchema = z.object({
  category: z.string().optional(),
  lowStockOnly: z.coerce.boolean().optional(),
});
export type InventoryItemSearchInput = z.infer<typeof inventoryItemSearchSchema>;

// -------------------------------------------------------------------------
// Vendors
// -------------------------------------------------------------------------

export const VENDOR_TYPES = ["VENDOR", "CUSTOMER"] as const;
export type VendorTypeValue = (typeof VENDOR_TYPES)[number];

export const createVendorSchema = z.object({
  name: z.string().min(1).max(150),
  type: z.enum(VENDOR_TYPES).default("VENDOR"),
  studentId: z.string().min(1).optional(),
  contactPerson: z.string().max(120).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(300).optional(),
});
export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const updateVendorSchema = createVendorSchema.partial();
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

// -------------------------------------------------------------------------
// Purchase orders
// -------------------------------------------------------------------------

export const purchaseOrderItemInputSchema = z.object({
  description: z.string().min(1).max(200),
  inventoryItemId: z.string().min(1).optional(),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().nonnegative(),
});
export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemInputSchema>;

export const createPurchaseOrderSchema = z.object({
  vendorId: z.string().min(1),
  expectedDate: z.coerce.date().optional(),
  items: z.array(purchaseOrderItemInputSchema).min(1),
});
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export const purchaseOrderSearchSchema = z.object({
  vendorId: z.string().optional(),
  status: z.enum(PURCHASE_ORDER_STATUSES).optional(),
});
export type PurchaseOrderSearchInput = z.infer<typeof purchaseOrderSearchSchema>;

// -------------------------------------------------------------------------
// Stock movements
// -------------------------------------------------------------------------

export const recordStockMovementSchema = z.object({
  inventoryItemId: z.string().min(1),
  type: z.enum(STOCK_MOVEMENT_TYPES),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().max(300).optional(),
  issuedToStaffId: z.string().min(1).optional(),
});
export type RecordStockMovementInput = z.infer<typeof recordStockMovementSchema>;
