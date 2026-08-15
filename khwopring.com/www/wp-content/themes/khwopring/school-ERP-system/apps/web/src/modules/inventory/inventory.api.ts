import { api } from "@/lib/api";
import type { PaginatedResult } from "@erp/shared";

export interface Asset {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchaseCost: string;
  location?: string | null;
  condition?: string | null;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  createdAt: string;
}

export type VendorType = "VENDOR" | "CUSTOMER";

export interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  studentId?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  description: string;
  inventoryItemId?: string | null;
  inventoryItem?: InventoryItem | null;
  quantity: number;
  unitCost: string;
}

export type PurchaseOrderStatus = "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED";

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendor: Vendor;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate?: string | null;
  totalAmount: string;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export type StockMovementType = "IN" | "OUT" | "DAMAGE";

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string | null;
  issuedToStaffId?: string | null;
  createdAt: string;
}

export const inventoryApi = {
  // Assets
  listAssets: (params: { page?: number; pageSize?: number; search?: string; category?: string }) =>
    api.get<PaginatedResult<Asset>>("/inventory/assets", { params }).then((r) => r.data),
  getAsset: (id: string) => api.get<{ asset: Asset }>(`/inventory/assets/${id}`).then((r) => r.data.asset),
  createAsset: (data: {
    name: string;
    category: string;
    purchaseDate: string;
    purchaseCost: number;
    location?: string;
    condition?: string;
  }) => api.post<{ asset: Asset }>("/inventory/assets", data).then((r) => r.data.asset),
  updateAsset: (id: string, data: Partial<Asset>) =>
    api.patch<{ asset: Asset }>(`/inventory/assets/${id}`, data).then((r) => r.data.asset),
  deleteAsset: (id: string) => api.delete(`/inventory/assets/${id}`),

  // Inventory items
  listItems: (params: { page?: number; pageSize?: number; search?: string; category?: string; lowStockOnly?: boolean }) =>
    api.get<PaginatedResult<InventoryItem>>("/inventory/items", { params }).then((r) => r.data),
  getItem: (id: string) => api.get<{ item: InventoryItem }>(`/inventory/items/${id}`).then((r) => r.data.item),
  createItem: (data: { name: string; category: string; unit: string; reorderLevel?: number }) =>
    api.post<{ item: InventoryItem }>("/inventory/items", data).then((r) => r.data.item),
  updateItem: (id: string, data: Partial<InventoryItem>) =>
    api.patch<{ item: InventoryItem }>(`/inventory/items/${id}`, data).then((r) => r.data.item),
  listItemMovements: (id: string) =>
    api.get<{ movements: StockMovement[] }>(`/inventory/items/${id}/movements`).then((r) => r.data.movements),
  adjustStock: (data: {
    inventoryItemId: string;
    type: StockMovementType;
    quantity: number;
    reason?: string;
    issuedToStaffId?: string;
  }) => api.post<{ item: InventoryItem }>("/inventory/stock-movements", data).then((r) => r.data.item),

  // Vendors
  listVendors: (params: { page?: number; pageSize?: number; search?: string }) =>
    api.get<PaginatedResult<Vendor>>("/inventory/vendors", { params }).then((r) => r.data),
  getVendor: (id: string) => api.get<{ vendor: Vendor }>(`/inventory/vendors/${id}`).then((r) => r.data.vendor),
  createVendor: (data: { name: string; contactPerson?: string; phone?: string; email?: string; address?: string }) =>
    api.post<{ vendor: Vendor }>("/inventory/vendors", data).then((r) => r.data.vendor),
  updateVendor: (id: string, data: Partial<Vendor>) =>
    api.patch<{ vendor: Vendor }>(`/inventory/vendors/${id}`, data).then((r) => r.data.vendor),

  // Purchase orders
  listPurchaseOrders: (params: { page?: number; pageSize?: number; vendorId?: string; status?: string }) =>
    api.get<PaginatedResult<PurchaseOrder>>("/inventory/purchase-orders", { params }).then((r) => r.data),
  getPurchaseOrder: (id: string) =>
    api.get<{ purchaseOrder: PurchaseOrder }>(`/inventory/purchase-orders/${id}`).then((r) => r.data.purchaseOrder),
  createPurchaseOrder: (data: {
    vendorId: string;
    expectedDate?: string;
    items: { description: string; inventoryItemId?: string; quantity: number; unitCost: number }[];
  }) => api.post<{ purchaseOrder: PurchaseOrder }>("/inventory/purchase-orders", data).then((r) => r.data.purchaseOrder),
  approvePurchaseOrder: (id: string) =>
    api.post<{ purchaseOrder: PurchaseOrder }>(`/inventory/purchase-orders/${id}/approve`, {}).then((r) => r.data.purchaseOrder),
  receivePurchaseOrder: (id: string) =>
    api.post<{ purchaseOrder: PurchaseOrder }>(`/inventory/purchase-orders/${id}/receive`, {}).then((r) => r.data.purchaseOrder),
  cancelPurchaseOrder: (id: string) =>
    api.post<{ purchaseOrder: PurchaseOrder }>(`/inventory/purchase-orders/${id}/cancel`, {}).then((r) => r.data.purchaseOrder),
};
