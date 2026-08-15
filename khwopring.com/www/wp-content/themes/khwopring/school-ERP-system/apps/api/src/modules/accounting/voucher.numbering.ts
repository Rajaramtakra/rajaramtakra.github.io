import type { VoucherType } from "@erp/shared";
import { prisma } from "../../lib/prisma";

const PREFIX: Record<VoucherType, string> = {
  JOURNAL: "JNL",
  PAYMENT: "PYV",
  RECEIPT: "RCV",
  CONTRA: "CTV",
};

export async function generateVoucherNumber(schoolId: string, voucherType: VoucherType): Promise<string> {
  const prefix = PREFIX[voucherType];
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.journalEntry.count({
      where: { schoolId, voucherType, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    const candidate = `${prefix}-${year}-${String(count + 1 + attempt).padStart(5, "0")}`;
    const exists = await prisma.journalEntry.findUnique({ where: { voucherNumber: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Failed to generate a unique voucher number");
}
