import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  inventoryItem: { findMany: vi.fn(), update: vi.fn() },
  vendor: { findFirst: vi.fn() },
  sale: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  stockMovement: { create: vi.fn() },
  salePayment: { create: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("../../src/lib/storage", () => ({
  storage: { save: vi.fn().mockResolvedValue({ filePath: "sale-receipts/x.pdf", fileName: "x.pdf" }) },
}));

import { cancelSale, collectSalePayment, createSale } from "../../src/modules/pos/pos.service";

describe("pos.service - createSale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a sale that would take an item's stock negative", async () => {
    mockPrisma.inventoryItem.findMany.mockResolvedValue([
      { id: "item_1", schoolId: "school_1", name: "Notebook", quantity: 2, unit: "pcs" },
    ]);

    await expect(
      createSale("school_1", "user_1", {
        items: [{ inventoryItemId: "item_1", description: "Notebook", quantity: 5, unitPrice: 20 }],
      })
    ).rejects.toThrow(/insufficient stock/i);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("creates a sale, a SALE_OUT movement, and decrements stock for each item", async () => {
    mockPrisma.inventoryItem.findMany.mockResolvedValue([
      { id: "item_1", schoolId: "school_1", name: "Notebook", quantity: 10, unit: "pcs" },
    ]);
    mockPrisma.sale.count.mockResolvedValue(0);
    mockPrisma.sale.findUnique.mockResolvedValue(null);
    mockPrisma.sale.create.mockResolvedValue({ id: "sale_1", saleNumber: "SALE-2026-00001", totalAmount: 40 });

    const sale = await createSale("school_1", "user_1", {
      items: [{ inventoryItemId: "item_1", description: "Notebook", quantity: 2, unitPrice: 20 }],
    });

    expect(sale.id).toBe("sale_1");
    expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ inventoryItemId: "item_1", type: "SALE_OUT", quantity: 2 }) })
    );
    expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { quantity: { decrement: 2 } },
    });
  });

  it("rejects when the counterparty is not a CUSTOMER-type vendor in this school", async () => {
    mockPrisma.inventoryItem.findMany.mockResolvedValue([
      { id: "item_1", schoolId: "school_1", name: "Notebook", quantity: 10, unit: "pcs" },
    ]);
    mockPrisma.vendor.findFirst.mockResolvedValue(null);

    await expect(
      createSale("school_1", "user_1", {
        counterpartyId: "vendor_1",
        items: [{ inventoryItemId: "item_1", description: "Notebook", quantity: 1, unitPrice: 20 }],
      })
    ).rejects.toThrow(/customer not found/i);
  });
});

describe("pos.service - cancelSale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses to cancel a sale that already has payments recorded", async () => {
    mockPrisma.sale.findFirst.mockResolvedValue({
      id: "sale_1",
      schoolId: "school_1",
      status: "COMPLETED",
      paidAmount: 40,
      items: [],
    });

    await expect(cancelSale("school_1", "sale_1")).rejects.toThrow(/already has payments/i);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("restocks every line item via an IN movement on cancellation", async () => {
    mockPrisma.sale.findFirst
      .mockResolvedValueOnce({
        id: "sale_1",
        schoolId: "school_1",
        status: "COMPLETED",
        paidAmount: 0,
        saleNumber: "SALE-2026-00001",
        items: [{ inventoryItemId: "item_1", quantity: 3 }],
      })
      .mockResolvedValueOnce({ id: "sale_1", status: "CANCELLED", items: [] });
    mockPrisma.sale.update.mockResolvedValue({ id: "sale_1", status: "CANCELLED" });

    await cancelSale("school_1", "sale_1");

    expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ inventoryItemId: "item_1", type: "IN", quantity: 3 }) })
    );
    expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { quantity: { increment: 3 } },
    });
  });
});

describe("pos.service - collectSalePayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a payment that exceeds the outstanding balance", async () => {
    mockPrisma.sale.findFirst.mockResolvedValue({
      id: "sale_1",
      schoolId: "school_1",
      status: "COMPLETED",
      totalAmount: 40,
      paidAmount: 0,
      saleNumber: "SALE-2026-00001",
      items: [],
    });

    await expect(
      collectSalePayment("school_1", "user_1", "sale_1", { amount: 100, method: "CASH" })
    ).rejects.toThrow(/exceeds the outstanding balance/i);
    expect(mockPrisma.salePayment.create).not.toHaveBeenCalled();
  });

  it("records a payment and generates a receipt PDF", async () => {
    mockPrisma.sale.findFirst.mockResolvedValue({
      id: "sale_1",
      schoolId: "school_1",
      status: "COMPLETED",
      totalAmount: 40,
      paidAmount: 0,
      saleNumber: "SALE-2026-00001",
      items: [],
    });
    mockPrisma.salePayment.count.mockResolvedValue(0);
    mockPrisma.salePayment.findUnique.mockResolvedValue(null);
    mockPrisma.salePayment.create.mockResolvedValue({ id: "pay_1", paidAt: new Date("2026-01-01") });
    mockPrisma.salePayment.update.mockResolvedValue({ id: "pay_1", filePath: "sale-receipts/x.pdf" });

    const result = await collectSalePayment("school_1", "user_1", "sale_1", { amount: 40, method: "CASH" });

    expect(result.payment.filePath).toBe("sale-receipts/x.pdf");
    expect(mockPrisma.sale.update).toHaveBeenCalledWith({ where: { id: "sale_1" }, data: { paidAmount: 40 } });
  });
});
