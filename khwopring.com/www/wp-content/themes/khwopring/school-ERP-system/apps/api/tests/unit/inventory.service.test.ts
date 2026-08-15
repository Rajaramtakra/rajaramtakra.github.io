import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  purchaseOrder: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  inventoryItem: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  stockMovement: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  vendor: { findFirst: vi.fn() },
  staffMember: { findFirst: vi.fn() },
  $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { adjustStock, receivePurchaseOrder } from "../../src/modules/inventory/stock.service";

describe("inventory stock.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("receivePurchaseOrder", () => {
    it("increments stock and records an IN movement for line items linked to an inventory item, leaving unlinked items alone", async () => {
      const po = {
        id: "po_1",
        schoolId: "school_1",
        status: "ORDERED",
        items: [
          { id: "poi_1", inventoryItemId: "item_1", description: "Chalk boxes", quantity: 10, unitCost: 2 },
          { id: "poi_2", inventoryItemId: null, description: "Custom lab desk", quantity: 1, unitCost: 500 },
        ],
      };
      mockPrisma.purchaseOrder.findFirst.mockResolvedValue(po);
      mockPrisma.purchaseOrder.update.mockResolvedValue({ ...po, status: "RECEIVED" });
      mockPrisma.stockMovement.create.mockResolvedValue({ id: "mv_1" });
      mockPrisma.inventoryItem.update.mockResolvedValue({ id: "item_1", quantity: 20 });

      await receivePurchaseOrder("school_1", "po_1");

      expect(mockPrisma.stockMovement.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ inventoryItemId: "item_1", type: "IN", quantity: 10 }),
        })
      );

      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: "item_1" },
        data: { quantity: { increment: 10 } },
      });

      expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "po_1" }, data: { status: "RECEIVED" } })
      );
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("refuses to receive a purchase order that isn't ORDERED", async () => {
      mockPrisma.purchaseOrder.findFirst.mockResolvedValue({ id: "po_1", schoolId: "school_1", status: "DRAFT", items: [] });

      await expect(receivePurchaseOrder("school_1", "po_1")).rejects.toThrow(/must be ORDERED/i);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("adjustStock", () => {
    it("rejects an OUT movement that would take quantity negative", async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue({
        id: "item_1",
        schoolId: "school_1",
        name: "Whiteboard marker",
        quantity: 5,
        unit: "pcs",
        deletedAt: null,
      });

      await expect(
        adjustStock("school_1", { inventoryItemId: "item_1", type: "OUT", quantity: 10 })
      ).rejects.toThrow(/insufficient stock/i);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockPrisma.stockMovement.create).not.toHaveBeenCalled();
    });

    it("allows an IN movement and increments quantity via a transaction", async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue({
        id: "item_1",
        schoolId: "school_1",
        name: "Whiteboard marker",
        quantity: 5,
        unit: "pcs",
        deletedAt: null,
      });
      mockPrisma.stockMovement.create.mockResolvedValue({ id: "mv_1" });
      mockPrisma.inventoryItem.update.mockResolvedValue({ id: "item_1", quantity: 15 });

      await adjustStock("school_1", { inventoryItemId: "item_1", type: "IN", quantity: 10, reason: "Restock" });

      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: "item_1" },
        data: { quantity: { increment: 10 } },
      });
    });

    it("allows an OUT movement that keeps quantity at or above zero", async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue({
        id: "item_1",
        schoolId: "school_1",
        name: "Whiteboard marker",
        quantity: 5,
        unit: "pcs",
        deletedAt: null,
      });
      mockPrisma.stockMovement.create.mockResolvedValue({ id: "mv_2" });
      mockPrisma.inventoryItem.update.mockResolvedValue({ id: "item_1", quantity: 0 });

      await adjustStock("school_1", { inventoryItemId: "item_1", type: "OUT", quantity: 5 });

      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: "item_1" },
        data: { quantity: { increment: -5 } },
      });
    });

    it("treats DAMAGE like OUT: rejects when it would take quantity negative", async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue({
        id: "item_1",
        schoolId: "school_1",
        name: "Lab beaker",
        quantity: 3,
        unit: "pcs",
        deletedAt: null,
      });

      await expect(
        adjustStock("school_1", { inventoryItemId: "item_1", type: "DAMAGE", quantity: 5 })
      ).rejects.toThrow(/insufficient stock/i);
    });

    it("records issuedToStaffId on the movement after validating the staff member exists", async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue({
        id: "item_1",
        schoolId: "school_1",
        name: "Whiteboard marker",
        quantity: 10,
        unit: "pcs",
        deletedAt: null,
      });
      mockPrisma.staffMember.findFirst.mockResolvedValue({ id: "staff_1", schoolId: "school_1" });
      mockPrisma.stockMovement.create.mockResolvedValue({ id: "mv_3" });
      mockPrisma.inventoryItem.update.mockResolvedValue({ id: "item_1", quantity: 8 });

      await adjustStock("school_1", { inventoryItemId: "item_1", type: "OUT", quantity: 2, issuedToStaffId: "staff_1" });

      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ issuedToStaffId: "staff_1" }) })
      );
    });

    it("rejects issuing to a staff member outside this school", async () => {
      mockPrisma.inventoryItem.findFirst.mockResolvedValue({
        id: "item_1",
        schoolId: "school_1",
        name: "Whiteboard marker",
        quantity: 10,
        unit: "pcs",
        deletedAt: null,
      });
      mockPrisma.staffMember.findFirst.mockResolvedValue(null);

      await expect(
        adjustStock("school_1", { inventoryItemId: "item_1", type: "OUT", quantity: 2, issuedToStaffId: "staff_missing" })
      ).rejects.toThrow(/not found/i);
      expect(mockPrisma.stockMovement.create).not.toHaveBeenCalled();
    });
  });
});
