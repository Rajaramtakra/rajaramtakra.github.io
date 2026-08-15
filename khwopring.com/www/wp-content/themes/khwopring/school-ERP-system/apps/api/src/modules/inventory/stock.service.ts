import type {
  CreateInventoryItemInput,
  CreatePurchaseOrderInput,
  CreateVendorInput,
  InventoryItemSearchInput,
  PaginationQuery,
  PurchaseOrderSearchInput,
  RecordStockMovementInput,
  UpdateInventoryItemInput,
  UpdateVendorInput,
} from "@erp/shared";
import type { PurchaseOrderStatus as PrismaPurchaseOrderStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors";
import { buildPaginationArgs, toPaginatedResult } from "../../lib/pagination";

// =========================================================================
// Inventory items
// =========================================================================

async function findItemOrThrow(schoolId: string, id: string) {
  const item = await prisma.inventoryItem.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!item) throw new NotFoundError("Inventory item not found");
  return item;
}

export async function listItems(schoolId: string, pagination: PaginationQuery, filters: InventoryItemSearchInput) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    deletedAt: null,
    ...(filters.category ? { category: filters.category } : {}),
    ...(pagination.search
      ? { name: { contains: pagination.search, mode: "insensitive" as const } }
      : {}),
  };

  const [allMatching, total] = await Promise.all([
    prisma.inventoryItem.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.inventoryItem.count({ where }),
  ]);

  const data = filters.lowStockOnly ? allMatching.filter((i) => i.quantity <= i.reorderLevel) : allMatching;

  return toPaginatedResult(data, total, page, pageSize);
}

export async function getItem(schoolId: string, id: string) {
  return findItemOrThrow(schoolId, id);
}

export async function createItem(schoolId: string, input: CreateInventoryItemInput) {
  return prisma.inventoryItem.create({
    data: {
      schoolId,
      name: input.name,
      category: input.category,
      unit: input.unit,
      reorderLevel: input.reorderLevel ?? 0,
    },
  });
}

export async function updateItem(schoolId: string, id: string, input: UpdateInventoryItemInput) {
  await findItemOrThrow(schoolId, id);
  return prisma.inventoryItem.update({ where: { id }, data: input });
}

export async function listMovementsForItem(schoolId: string, itemId: string) {
  await findItemOrThrow(schoolId, itemId);
  return prisma.stockMovement.findMany({ where: { inventoryItemId: itemId }, orderBy: { createdAt: "desc" } });
}

/** Manual stock adjustment (e.g. correction, wastage, restock outside a PO). Guards against negative stock on OUT/DAMAGE. */
export async function adjustStock(schoolId: string, input: RecordStockMovementInput) {
  const item = await findItemOrThrow(schoolId, input.inventoryItemId);

  if (input.type !== "IN" && item.quantity - input.quantity < 0) {
    throw new BadRequestError(
      `Insufficient stock: ${item.name} has ${item.quantity} ${item.unit}, cannot remove ${input.quantity}`
    );
  }
  if (input.issuedToStaffId) {
    const staff = await prisma.staffMember.findFirst({ where: { id: input.issuedToStaffId, schoolId, deletedAt: null } });
    if (!staff) throw new NotFoundError("Staff member not found");
  }

  const delta = input.type === "IN" ? input.quantity : -input.quantity;

  const [, updatedItem] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        inventoryItemId: item.id,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason,
        issuedToStaffId: input.issuedToStaffId,
      },
    }),
    prisma.inventoryItem.update({ where: { id: item.id }, data: { quantity: { increment: delta } } }),
  ]);

  return updatedItem;
}

// =========================================================================
// Vendors
// =========================================================================

async function findVendorOrThrow(schoolId: string, id: string) {
  const vendor = await prisma.vendor.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!vendor) throw new NotFoundError("Vendor not found");
  return vendor;
}

export async function listVendors(schoolId: string, pagination: PaginationQuery) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    deletedAt: null,
    ...(pagination.search
      ? { name: { contains: pagination.search, mode: "insensitive" as const } }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.vendor.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.vendor.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function getVendor(schoolId: string, id: string) {
  return findVendorOrThrow(schoolId, id);
}

export async function createVendor(schoolId: string, input: CreateVendorInput) {
  return prisma.vendor.create({ data: { schoolId, ...input } });
}

export async function updateVendor(schoolId: string, id: string, input: UpdateVendorInput) {
  await findVendorOrThrow(schoolId, id);
  return prisma.vendor.update({ where: { id }, data: input });
}

// =========================================================================
// Purchase orders
// =========================================================================

const PURCHASE_ORDER_INCLUDE = {
  vendor: true,
  items: { include: { inventoryItem: true } },
} as const;

async function findPurchaseOrderOrThrow(schoolId: string, id: string) {
  const po = await prisma.purchaseOrder.findFirst({ where: { id, schoolId }, include: PURCHASE_ORDER_INCLUDE });
  if (!po) throw new NotFoundError("Purchase order not found");
  return po;
}

export async function listPurchaseOrders(
  schoolId: string,
  pagination: PaginationQuery,
  filters: PurchaseOrderSearchInput
) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    ...(filters.vendorId ? { vendorId: filters.vendorId } : {}),
    ...(filters.status ? { status: filters.status as PrismaPurchaseOrderStatus } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.purchaseOrder.findMany({ where, include: PURCHASE_ORDER_INCLUDE, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function getPurchaseOrder(schoolId: string, id: string) {
  return findPurchaseOrderOrThrow(schoolId, id);
}

export async function createPurchaseOrder(schoolId: string, createdById: string, input: CreatePurchaseOrderInput) {
  const vendor = await prisma.vendor.findFirst({ where: { id: input.vendorId, schoolId, deletedAt: null } });
  if (!vendor) throw new NotFoundError("Vendor not found");

  if (input.items.some((i) => i.inventoryItemId)) {
    const ids = input.items.map((i) => i.inventoryItemId).filter((id): id is string => Boolean(id));
    const found = await prisma.inventoryItem.findMany({ where: { id: { in: ids }, schoolId, deletedAt: null } });
    if (found.length !== new Set(ids).size) {
      throw new BadRequestError("One or more inventory items were not found in this school");
    }
  }

  // Never trust a client-supplied total; always compute server-side.
  const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const po = await prisma.purchaseOrder.create({
    data: {
      schoolId,
      vendorId: input.vendorId,
      status: "DRAFT",
      expectedDate: input.expectedDate,
      totalAmount,
      createdById,
      items: {
        create: input.items.map((item) => ({
          description: item.description,
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
    },
    include: PURCHASE_ORDER_INCLUDE,
  });

  return po;
}

function assertStatus(current: PrismaPurchaseOrderStatus, expected: PrismaPurchaseOrderStatus) {
  if (current !== expected) {
    throw new ConflictError(`Purchase order must be ${expected} for this action (currently ${current})`);
  }
}

/** DRAFT -> ORDERED. Represents PO approval / placing the order with the vendor. */
export async function approvePurchaseOrder(schoolId: string, id: string) {
  const po = await findPurchaseOrderOrThrow(schoolId, id);
  assertStatus(po.status, "DRAFT");
  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: "ORDERED" },
    include: PURCHASE_ORDER_INCLUDE,
  });
}

/**
 * ORDERED -> RECEIVED. For every line item linked to an inventory item, records an IN stock
 * movement and increments the item's quantity, all within a single transaction. Line items
 * without a linked inventoryItemId (e.g. one-off asset purchases) are left as PO history only.
 */
export async function receivePurchaseOrder(schoolId: string, id: string) {
  const po = await findPurchaseOrderOrThrow(schoolId, id);
  assertStatus(po.status, "ORDERED");

  const stockableItems = po.items.filter((item) => item.inventoryItemId);

  await prisma.$transaction([
    prisma.purchaseOrder.update({ where: { id }, data: { status: "RECEIVED" } }),
    ...stockableItems.map((item) =>
      prisma.stockMovement.create({
        data: {
          inventoryItemId: item.inventoryItemId!,
          type: "IN",
          quantity: item.quantity,
          reason: `Received from PO ${po.id}`,
        },
      })
    ),
    ...stockableItems.map((item) =>
      prisma.inventoryItem.update({
        where: { id: item.inventoryItemId! },
        data: { quantity: { increment: item.quantity } },
      })
    ),
  ]);

  return findPurchaseOrderOrThrow(schoolId, id);
}

/** DRAFT or ORDERED -> CANCELLED. */
export async function cancelPurchaseOrder(schoolId: string, id: string) {
  const po = await findPurchaseOrderOrThrow(schoolId, id);
  if (po.status !== "DRAFT" && po.status !== "ORDERED") {
    throw new ConflictError(`Purchase order is already ${po.status} and cannot be cancelled`);
  }
  return prisma.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED" }, include: PURCHASE_ORDER_INCLUDE });
}
