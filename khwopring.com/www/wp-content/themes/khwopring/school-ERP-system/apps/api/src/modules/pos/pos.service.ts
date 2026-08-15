import type { CollectSalePaymentInput, CreateSaleInput, SaleSearchInput } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors";
import { generateSaleNumber, generateSaleReceiptNumber } from "./sale.numbering";
import { renderPdfBuffer, generateQrPng } from "../../lib/pdf";
import { storage } from "../../lib/storage";

const SALE_INCLUDE = {
  counterparty: true,
  items: { include: { inventoryItem: true } },
  payments: true,
  soldBy: { select: { id: true, fullName: true } },
} as const;

async function findOrThrow(schoolId: string, id: string) {
  const sale = await prisma.sale.findFirst({ where: { id, schoolId }, include: SALE_INCLUDE });
  if (!sale) throw new NotFoundError("Sale not found");
  return sale;
}

/**
 * Checks out a basket immediately (status COMPLETED): validates stock availability up front,
 * then atomically creates the sale + one SALE_OUT stock movement per item + decrements
 * inventory quantity, mirroring the transactional shape of library.service.ts's issueBook.
 */
export async function createSale(schoolId: string, soldById: string, input: CreateSaleInput) {
  const itemIds = [...new Set(input.items.map((i) => i.inventoryItemId))];
  const items = await prisma.inventoryItem.findMany({ where: { id: { in: itemIds }, schoolId, deletedAt: null } });
  if (items.length !== itemIds.length) {
    throw new BadRequestError("One or more inventory items were not found in this school");
  }

  const quantityByItem = new Map<string, number>();
  for (const line of input.items) {
    quantityByItem.set(line.inventoryItemId, (quantityByItem.get(line.inventoryItemId) ?? 0) + line.quantity);
  }
  for (const item of items) {
    const requested = quantityByItem.get(item.id)!;
    if (item.quantity - requested < 0) {
      throw new BadRequestError(
        `Insufficient stock: ${item.name} has ${item.quantity} ${item.unit}, cannot sell ${requested}`
      );
    }
  }

  if (input.counterpartyId) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: input.counterpartyId, schoolId, deletedAt: null, type: "CUSTOMER" },
    });
    if (!vendor) throw new NotFoundError("Customer not found");
  }

  const saleNumber = await generateSaleNumber(schoolId);
  const lineItems = input.items.map((i) => ({
    inventoryItemId: i.inventoryItemId,
    description: i.description,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    lineTotal: Math.round(i.quantity * i.unitPrice * 100) / 100,
  }));
  const totalAmount = Math.round(lineItems.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;

  const [sale] = await prisma.$transaction([
    prisma.sale.create({
      data: {
        schoolId,
        saleNumber,
        counterpartyId: input.counterpartyId,
        status: "COMPLETED",
        totalAmount,
        soldById,
        items: { create: lineItems },
      },
      include: SALE_INCLUDE,
    }),
    ...items.map((item) =>
      prisma.stockMovement.create({
        data: {
          inventoryItemId: item.id,
          type: "SALE_OUT",
          quantity: quantityByItem.get(item.id)!,
          reason: `Sale ${saleNumber}`,
        },
      })
    ),
    ...items.map((item) =>
      prisma.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: { decrement: quantityByItem.get(item.id)! } },
      })
    ),
  ]);

  return sale;
}

export function listSales(schoolId: string, filters: SaleSearchInput) {
  return prisma.sale.findMany({
    where: { schoolId, ...(filters.status ? { status: filters.status } : {}) },
    include: SALE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function getSale(schoolId: string, id: string) {
  return findOrThrow(schoolId, id);
}

/** Cancelling a completed sale restocks every line item via an IN movement, mirroring adjustStock. */
export async function cancelSale(schoolId: string, id: string) {
  const sale = await findOrThrow(schoolId, id);
  if (Number(sale.paidAmount) > 0) throw new ConflictError("Cannot cancel a sale that already has payments recorded");
  if (sale.status === "CANCELLED") throw new ConflictError("Sale is already cancelled");

  await prisma.$transaction([
    prisma.sale.update({ where: { id }, data: { status: "CANCELLED" } }),
    ...sale.items.map((item) =>
      prisma.stockMovement.create({
        data: {
          inventoryItemId: item.inventoryItemId,
          type: "IN",
          quantity: item.quantity,
          reason: `Sale ${sale.saleNumber} cancelled`,
        },
      })
    ),
    ...sale.items.map((item) =>
      prisma.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: { quantity: { increment: item.quantity } },
      })
    ),
  ]);

  return findOrThrow(schoolId, id);
}

export async function collectSalePayment(
  schoolId: string,
  receivedById: string,
  saleId: string,
  input: CollectSalePaymentInput
) {
  const sale = await findOrThrow(schoolId, saleId);
  if (sale.status === "CANCELLED") throw new ConflictError("Cannot record a payment against a cancelled sale");

  const outstanding = Number(sale.totalAmount) - Number(sale.paidAmount);
  if (input.amount > outstanding + 0.05) {
    throw new BadRequestError(`Payment amount (${input.amount}) exceeds the outstanding balance (${outstanding.toFixed(2)})`);
  }

  const receiptNumber = await generateSaleReceiptNumber(schoolId);

  const payment = await prisma.salePayment.create({
    data: {
      saleId: sale.id,
      amount: input.amount,
      method: input.method,
      transactionRef: input.transactionRef,
      receiptNumber,
      receivedById,
    },
  });

  await prisma.sale.update({
    where: { id: sale.id },
    data: { paidAmount: Number(sale.paidAmount) + input.amount },
  });

  const qr = await generateQrPng(`SALE-RECEIPT:${receiptNumber}`);
  const pdfBuffer = await renderPdfBuffer((doc) => {
    doc.fontSize(18).text("Sale Receipt", { align: "center" });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Receipt No: ${receiptNumber}`);
    doc.text(`Date: ${payment.paidAt.toDateString()}`);
    doc.text(`Sale No: ${sale.saleNumber}`);
    doc.moveDown();
    doc.text(`Amount Paid: ${input.amount.toFixed(2)}`);
    doc.text(`Method: ${input.method}`);
    if (input.transactionRef) doc.text(`Reference: ${input.transactionRef}`);
    doc.moveDown();
    doc.image(qr, { fit: [100, 100] });
  });
  const { filePath } = await storage.save(pdfBuffer, `${receiptNumber}.pdf`, "sale-receipts");
  const updatedPayment = await prisma.salePayment.update({ where: { id: payment.id }, data: { filePath } });

  return { payment: updatedPayment, sale: await findOrThrow(schoolId, sale.id) };
}

export async function listPaymentsForSale(schoolId: string, saleId: string) {
  await findOrThrow(schoolId, saleId);
  return prisma.salePayment.findMany({ where: { saleId }, orderBy: { paidAt: "desc" } });
}
