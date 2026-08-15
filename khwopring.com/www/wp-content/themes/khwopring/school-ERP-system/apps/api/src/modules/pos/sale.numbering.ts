import { prisma } from "../../lib/prisma";

export async function generateSaleNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.sale.count({ where: { schoolId, createdAt: { gte: new Date(`${year}-01-01`) } } });
    const candidate = `SALE-${year}-${String(count + 1 + attempt).padStart(5, "0")}`;
    const exists = await prisma.sale.findUnique({ where: { saleNumber: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Failed to generate a unique sale number");
}

export async function generateSaleReceiptNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.salePayment.count({
      where: { sale: { schoolId }, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    const candidate = `SRC-${year}-${String(count + 1 + attempt).padStart(5, "0")}`;
    const exists = await prisma.salePayment.findUnique({ where: { receiptNumber: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Failed to generate a unique sale receipt number");
}
