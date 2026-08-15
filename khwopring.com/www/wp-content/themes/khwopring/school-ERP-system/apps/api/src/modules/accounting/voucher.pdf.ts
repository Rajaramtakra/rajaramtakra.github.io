import { renderPdfBuffer } from "../../lib/pdf";

export interface VoucherPdfLine {
  accountName: string;
  debit: number;
  credit: number;
}

export interface VoucherPdfInput {
  school: { name: string; address: string | null; phone: string | null; email: string | null };
  voucherType: string;
  voucherNumber: string;
  entryDate: Date;
  reference: string | null;
  description: string;
  lines: VoucherPdfLine[];
}

const VOUCHER_TITLE: Record<string, string> = {
  PAYMENT: "Payment Voucher",
  RECEIPT: "Receipt Voucher",
  CONTRA: "Contra Voucher",
  JOURNAL: "Journal Voucher",
};

export function generateVoucherPdf(input: VoucherPdfInput): Promise<Buffer> {
  return renderPdfBuffer((doc) => {
    doc.fontSize(16).text(input.school.name, { align: "center" });
    doc.fontSize(9).fillColor("gray");
    if (input.school.address) doc.text(input.school.address, { align: "center" });
    const contactLine = [input.school.phone, input.school.email].filter(Boolean).join("   |   ");
    if (contactLine) doc.text(contactLine, { align: "center" });
    doc.fillColor("black");
    doc.moveDown();

    doc.fontSize(18).text(VOUCHER_TITLE[input.voucherType] ?? "Voucher", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Voucher No: ${input.voucherNumber}`);
    doc.text(`Date: ${input.entryDate.toDateString()}`);
    if (input.reference) doc.text(`Reference: ${input.reference}`);
    doc.text(`Description: ${input.description}`);
    doc.moveDown();

    doc.fontSize(12).text("Accounts", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of input.lines) {
      doc.text(`${line.accountName}   Debit: ${line.debit.toFixed(2)}   Credit: ${line.credit.toFixed(2)}`);
      totalDebit += line.debit;
      totalCredit += line.credit;
    }
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Total Debit: ${totalDebit.toFixed(2)}`);
    doc.text(`Total Credit: ${totalCredit.toFixed(2)}`);
    doc.moveDown(3);
    doc.fontSize(9).text("Prepared By: ______________________        Authorized By: ______________________");
  });
}
