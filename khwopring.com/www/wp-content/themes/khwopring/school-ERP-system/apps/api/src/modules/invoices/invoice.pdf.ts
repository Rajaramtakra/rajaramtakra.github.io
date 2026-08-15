import { renderPdfBuffer } from "../../lib/pdf";

export interface InvoicePdfItem {
  description: string;
  amount: number;
}

export interface InvoicePdfInput {
  school: { name: string; address: string | null; phone: string | null; email: string | null };
  invoiceNumber: string;
  dueDate: Date;
  status: string;
  studentName: string;
  registrationNumber: string;
  academicSessionName: string;
  items: InvoicePdfItem[];
  totalAmount: number;
  paidAmount: number;
}

export function generateInvoicePdf(input: InvoicePdfInput): Promise<Buffer> {
  return renderPdfBuffer((doc) => {
    doc.fontSize(16).text(input.school.name, { align: "center" });
    doc.fontSize(9).fillColor("gray");
    if (input.school.address) doc.text(input.school.address, { align: "center" });
    const contactLine = [input.school.phone, input.school.email].filter(Boolean).join("   |   ");
    if (contactLine) doc.text(contactLine, { align: "center" });
    doc.fillColor("black");
    doc.moveDown();

    doc.fontSize(18).text("Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Invoice No: ${input.invoiceNumber}`);
    doc.text(`Due date: ${input.dueDate.toDateString()}`);
    doc.text(`Status: ${input.status}`);
    doc.text(`Student: ${input.studentName} (${input.registrationNumber})`);
    doc.text(`Academic session: ${input.academicSessionName}`);
    doc.moveDown();

    doc.fontSize(12).text("Line items", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    for (const item of input.items) {
      doc.text(`${item.description}: ${item.amount.toFixed(2)}`);
    }
    doc.moveDown();

    const outstanding = input.totalAmount - input.paidAmount;
    doc.fontSize(11);
    doc.text(`Total: ${input.totalAmount.toFixed(2)}`);
    doc.text(`Paid: ${input.paidAmount.toFixed(2)}`);
    doc.text(`Outstanding: ${outstanding.toFixed(2)}`);
  });
}
