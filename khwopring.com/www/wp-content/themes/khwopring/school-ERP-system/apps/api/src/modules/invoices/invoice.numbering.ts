import { prisma } from "../../lib/prisma";

export async function generateInvoiceNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.invoice.count({ where: { schoolId, createdAt: { gte: new Date(`${year}-01-01`) } } });
    const candidate = `INV-${year}-${String(count + 1 + attempt).padStart(5, "0")}`;
    const exists = await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Failed to generate a unique invoice number");
}

export async function generateReceiptNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.payment.count({ where: { schoolId, createdAt: { gte: new Date(`${year}-01-01`) } } });
    const candidate = `RCT-${year}-${String(count + 1 + attempt).padStart(5, "0")}`;
    const exists = await prisma.payment.findUnique({ where: { receiptNumber: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Failed to generate a unique receipt number");
}
