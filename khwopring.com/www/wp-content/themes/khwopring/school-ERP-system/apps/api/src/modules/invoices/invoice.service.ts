import type { CollectPaymentInput, GenerateInvoiceInput, InvoiceSearchInput, Permission } from "@erp/shared";
import type { InvoiceStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors";
import { buildPaginationArgs, toPaginatedResult } from "../../lib/pagination";
import { generateInvoiceNumber } from "./invoice.numbering";
import { generateReceiptNumber } from "./invoice.numbering";
import { renderPdfBuffer, generateQrPng } from "../../lib/pdf";
import { storage } from "../../lib/storage";
import { generateInvoicePdf } from "./invoice.pdf";

const INVOICE_INCLUDE = {
  student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
  academicSession: true,
  items: { include: { feeStructure: { include: { feeCategory: true } } } },
  installments: true,
  payments: true,
} as const;

async function findOrThrow(schoolId: string, id: string) {
  const invoice = await prisma.invoice.findFirst({ where: { id, schoolId }, include: INVOICE_INCLUDE });
  if (!invoice) throw new NotFoundError("Invoice not found");
  return invoice;
}

async function resolveOwnStudentIds(schoolId: string, userId: string): Promise<string[]> {
  const student = await prisma.student.findFirst({ where: { userId, schoolId, deletedAt: null } });
  if (student) return [student.id];

  const guardian = await prisma.guardian.findFirst({ where: { userId, schoolId, deletedAt: null } });
  if (guardian) {
    const links = await prisma.studentGuardian.findMany({ where: { guardianId: guardian.id } });
    return links.map((l) => l.studentId);
  }
  return [];
}

export async function generateInvoice(schoolId: string, input: GenerateInvoiceInput) {
  const feeStructures = await prisma.feeStructure.findMany({
    where: { id: { in: input.feeStructureIds }, schoolId, academicSessionId: input.academicSessionId, deletedAt: null },
    include: { feeCategory: true },
  });
  if (feeStructures.length !== input.feeStructureIds.length) {
    throw new BadRequestError("One or more fee structures were not found for this student's academic session");
  }

  const [discounts, scholarships] = await Promise.all([
    prisma.discount.findMany({
      where: {
        schoolId,
        studentId: input.studentId,
        OR: [{ feeStructureId: { in: input.feeStructureIds } }, { feeStructureId: null }],
      },
    }),
    prisma.scholarship.findMany({ where: { schoolId, studentId: input.studentId, academicSessionId: input.academicSessionId } }),
  ]);

  const items: { description: string; amount: number; feeStructureId?: string }[] = [];

  for (const structure of feeStructures) {
    const amount = Number(structure.amount);
    items.push({ description: structure.feeCategory.name, amount, feeStructureId: structure.id });

    for (const discount of discounts.filter((d) => d.feeStructureId === structure.id)) {
      const reduction =
        discount.type === "PERCENT" ? Math.min(amount, (amount * Number(discount.value)) / 100) : Math.min(amount, Number(discount.value));
      items.push({ description: `Discount: ${discount.reason}`, amount: -reduction, feeStructureId: structure.id });
    }
  }

  for (const scholarship of scholarships) {
    items.push({ description: `Scholarship: ${scholarship.name}`, amount: -Number(scholarship.amount) });
  }

  const totalAmount = Math.max(0, Math.round(items.reduce((sum, i) => sum + i.amount, 0) * 100) / 100);

  if (input.installments && input.installments.length > 0) {
    const installmentTotal = Math.round(input.installments.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;
    if (Math.abs(installmentTotal - totalAmount) > 0.05) {
      throw new BadRequestError(
        `Installment amounts (${installmentTotal}) must add up to the invoice total (${totalAmount})`
      );
    }
  }

  const invoiceNumber = await generateInvoiceNumber(schoolId);

  const invoice = await prisma.invoice.create({
    data: {
      schoolId,
      studentId: input.studentId,
      academicSessionId: input.academicSessionId,
      invoiceNumber,
      dueDate: input.dueDate,
      totalAmount,
      status: "ISSUED",
      items: { create: items },
      ...(input.installments && input.installments.length > 0
        ? { installments: { create: input.installments.map((i) => ({ dueDate: i.dueDate, amount: i.amount })) } }
        : {}),
    },
    include: INVOICE_INCLUDE,
  });

  return invoice;
}

export async function getInvoice(schoolId: string, id: string) {
  return findOrThrow(schoolId, id);
}

export async function getInvoiceForCaller(schoolId: string, requester: { userId: string; permissions: Permission[] }, id: string) {
  const invoice = await findOrThrow(schoolId, id);
  if (!requester.permissions.includes("invoice:manage")) {
    const ownIds = await resolveOwnStudentIds(schoolId, requester.userId);
    if (!ownIds.includes(invoice.studentId)) throw new NotFoundError("Invoice not found");
  }
  return invoice;
}

export async function listInvoices(schoolId: string, pagination: { page?: number; pageSize?: number }, filters: InvoiceSearchInput) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    ...(filters.studentId ? { studentId: filters.studentId } : {}),
    ...(filters.status ? { status: filters.status as InvoiceStatus } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({ where, include: INVOICE_INCLUDE, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.invoice.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function listInvoicesForCaller(
  schoolId: string,
  requester: { userId: string; permissions: Permission[] },
  pagination: { page?: number; pageSize?: number },
  filters: InvoiceSearchInput
) {
  if (requester.permissions.includes("invoice:manage")) return listInvoices(schoolId, pagination, filters);

  const ownIds = await resolveOwnStudentIds(schoolId, requester.userId);
  if (ownIds.length === 0) return toPaginatedResult([], 0, pagination.page ?? 1, pagination.pageSize ?? 20);

  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    studentId: { in: filters.studentId ? ownIds.filter((id) => id === filters.studentId) : ownIds },
    ...(filters.status ? { status: filters.status as InvoiceStatus } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({ where, include: INVOICE_INCLUDE, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.invoice.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function cancelInvoice(schoolId: string, id: string) {
  const invoice = await findOrThrow(schoolId, id);
  if (Number(invoice.paidAmount) > 0) throw new ConflictError("Cannot cancel an invoice that already has payments recorded");
  if (invoice.status === "CANCELLED") throw new ConflictError("Invoice is already cancelled");
  return prisma.invoice.update({ where: { id }, data: { status: "CANCELLED" }, include: INVOICE_INCLUDE });
}

/** Applies a received payment to an invoice: bumps paidAmount, recalculates status, and marks the oldest unpaid installments as settled. */
export async function applyPaymentToInvoice(schoolId: string, invoiceId: string, amount: number) {
  const invoice = await findOrThrow(schoolId, invoiceId);
  const newPaidAmount = Number(invoice.paidAmount) + amount;
  const status: InvoiceStatus =
    newPaidAmount >= Number(invoice.totalAmount)
      ? "PAID"
      : newPaidAmount > 0
        ? "PARTIALLY_PAID"
        : invoice.dueDate < new Date()
          ? "OVERDUE"
          : "ISSUED";

  await prisma.invoice.update({ where: { id: invoiceId }, data: { paidAmount: newPaidAmount, status } });

  let remaining = amount;
  const unpaidInstallments = invoice.installments.filter((i) => !i.paidAt).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  for (const installment of unpaidInstallments) {
    if (remaining <= 0) break;
    if (remaining + 0.005 >= Number(installment.amount)) {
      await prisma.installment.update({ where: { id: installment.id }, data: { paidAt: new Date() } });
      remaining -= Number(installment.amount);
    } else {
      break;
    }
  }

  return findOrThrow(schoolId, invoiceId);
}

export async function collectPayment(schoolId: string, receivedById: string, input: CollectPaymentInput) {
  const invoice = await findOrThrow(schoolId, input.invoiceId);
  if (invoice.status === "CANCELLED") throw new ConflictError("Cannot record a payment against a cancelled invoice");

  const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  if (input.amount > outstanding + 0.05) {
    throw new BadRequestError(`Payment amount (${input.amount}) exceeds the outstanding balance (${outstanding.toFixed(2)})`);
  }

  const receiptNumber = await generateReceiptNumber(schoolId);

  const payment = await prisma.payment.create({
    data: {
      schoolId,
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      amount: input.amount,
      method: input.method,
      transactionRef: input.transactionRef,
      receiptNumber,
      receivedById,
    },
  });

  await applyPaymentToInvoice(schoolId, invoice.id, input.amount);

  const student = await prisma.student.findUnique({ where: { id: invoice.studentId } });
  const qr = await generateQrPng(`RECEIPT:${receiptNumber}`);
  const pdfBuffer = await renderPdfBuffer((doc) => {
    doc.fontSize(18).text("Payment Receipt", { align: "center" });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Receipt No: ${receiptNumber}`);
    doc.text(`Date: ${payment.paidAt.toDateString()}`);
    doc.text(`Invoice No: ${invoice.invoiceNumber}`);
    doc.text(`Student: ${student ? `${student.firstName} ${student.lastName}` : ""}`);
    doc.moveDown();
    doc.text(`Amount Paid: ${input.amount.toFixed(2)}`);
    doc.text(`Method: ${input.method}`);
    if (input.transactionRef) doc.text(`Reference: ${input.transactionRef}`);
    doc.moveDown();
    doc.image(qr, { fit: [100, 100] });
  });
  const { filePath } = await storage.save(pdfBuffer, `${receiptNumber}.pdf`, "receipts");
  const updatedPayment = await prisma.payment.update({ where: { id: payment.id }, data: { filePath } });

  return { payment: updatedPayment, invoice: await findOrThrow(schoolId, invoice.id) };
}

export async function listPaymentsForInvoice(schoolId: string, invoiceId: string) {
  await findOrThrow(schoolId, invoiceId);
  return prisma.payment.findMany({ where: { schoolId, invoiceId }, orderBy: { paidAt: "desc" } });
}

export async function getStudentLedger(schoolId: string, studentId: string) {
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } });
  if (!student) throw new NotFoundError("Student not found");

  const invoices = await prisma.invoice.findMany({
    where: { schoolId, studentId },
    include: { academicSession: true, items: true, payments: { orderBy: { paidAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  const totalBilled = invoices
    .filter((i) => i.status !== "CANCELLED")
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + Number(i.paidAmount), 0);

  return {
    studentId,
    invoices,
    totalBilled,
    totalPaid,
    totalOutstanding: Math.max(0, Math.round((totalBilled - totalPaid) * 100) / 100),
  };
}

export async function getStudentLedgerForCaller(
  schoolId: string,
  requester: { userId: string; permissions: Permission[] },
  studentId: string
) {
  if (!requester.permissions.includes("invoice:manage") && !requester.permissions.includes("fee:read_own")) {
    throw new NotFoundError("Student not found");
  }
  if (!requester.permissions.includes("invoice:manage")) {
    const ownIds = await resolveOwnStudentIds(schoolId, requester.userId);
    if (!ownIds.includes(studentId)) throw new NotFoundError("Student not found");
  }
  return getStudentLedger(schoolId, studentId);
}

export async function generateNoDuesCertificatePdf(schoolId: string, studentId: string) {
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } });
  if (!student) throw new NotFoundError("Student not found");

  const invoices = await prisma.invoice.findMany({
    where: { schoolId, studentId, status: { not: "CANCELLED" } },
  });
  const outstanding = invoices.reduce((sum, i) => sum + (Number(i.totalAmount) - Number(i.paidAmount)), 0);
  if (outstanding > 0.05) {
    throw new ConflictError(
      `Cannot issue a no-dues certificate: outstanding balance of ${outstanding.toFixed(2)}`
    );
  }

  const school = await prisma.school.findUniqueOrThrow({ where: { id: schoolId } });
  const certificateNumber = `NDU-${new Date().getFullYear()}-${student.registrationNumber}`;

  const buffer = await renderPdfBuffer((doc) => {
    doc.fontSize(16).text(school.name, { align: "center" });
    doc.fontSize(9).fillColor("gray");
    if (school.address) doc.text(school.address, { align: "center" });
    doc.fillColor("black");
    doc.moveDown();

    doc.fontSize(18).text("No Dues Certificate", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Certificate No: ${certificateNumber}`);
    doc.text(`Date: ${new Date().toDateString()}`);
    doc.moveDown();
    doc.text(
      `This is to certify that ${student.firstName} ${student.lastName} ` +
        `(Registration No. ${student.registrationNumber}) has no outstanding fee dues as of the date of issue.`,
      { align: "justify" }
    );
    doc.moveDown(3);
    doc.text("Authorized Signature: _______________________");
  });

  return { buffer, certificateNumber };
}

export async function getInvoicePdf(schoolId: string, requester: { userId: string; permissions: Permission[] }, id: string) {
  const invoice = await getInvoiceForCaller(schoolId, requester, id);
  const school = await prisma.school.findUniqueOrThrow({ where: { id: schoolId } });

  const buffer = await generateInvoicePdf({
    school: { name: school.name, address: school.address, phone: school.phone, email: school.email },
    invoiceNumber: invoice.invoiceNumber,
    dueDate: invoice.dueDate,
    status: invoice.status,
    studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
    registrationNumber: invoice.student.registrationNumber,
    academicSessionName: invoice.academicSession.name,
    items: invoice.items.map((item) => ({ description: item.description, amount: Number(item.amount) })),
    totalAmount: Number(invoice.totalAmount),
    paidAmount: Number(invoice.paidAmount),
  });

  return { buffer, invoiceNumber: invoice.invoiceNumber };
}
