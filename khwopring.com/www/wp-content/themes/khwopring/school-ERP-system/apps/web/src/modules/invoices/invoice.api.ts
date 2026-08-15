import { api } from "@/lib/api";
import type { PaginatedResult } from "@erp/shared";

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number | string;
  feeStructureId?: string | null;
  feeStructure?: { id: string; feeCategory: { id: string; name: string } } | null;
}

export interface Installment {
  id: string;
  dueDate: string;
  amount: number | string;
  paidAt?: string | null;
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentId: string;
  amount: number | string;
  method: "CASH" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | "ONLINE";
  transactionRef?: string | null;
  receiptNumber?: string | null;
  filePath?: string | null;
  paidAt: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  studentId: string;
  academicSessionId: string;
  dueDate: string;
  totalAmount: number | string;
  paidAmount: number | string;
  status: InvoiceStatus;
  createdAt: string;
  student: { id: string; firstName: string; lastName: string; registrationNumber: string };
  academicSession: { id: string; name: string };
  items: InvoiceItem[];
  installments: Installment[];
  payments: Payment[];
}

export interface GenerateInvoicePayload {
  studentId: string;
  academicSessionId: string;
  dueDate: string;
  feeStructureIds: string[];
  installments?: { dueDate: string; amount: number }[];
}

export interface CollectPaymentPayload {
  amount: number;
  method: string;
  transactionRef?: string;
}

export const invoiceApi = {
  search: (params: { studentId?: string; status?: string; page?: number; pageSize?: number }) =>
    api.get<PaginatedResult<InvoiceRecord>>("/invoices", { params }).then((r) => r.data),
  get: (id: string) => api.get<{ invoice: InvoiceRecord }>(`/invoices/${id}`).then((r) => r.data.invoice),
  generate: (data: GenerateInvoicePayload) =>
    api.post<{ invoice: InvoiceRecord }>("/invoices", data).then((r) => r.data.invoice),
  cancel: (id: string) => api.post<{ invoice: InvoiceRecord }>(`/invoices/${id}/cancel`).then((r) => r.data.invoice),
  listPayments: (invoiceId: string) =>
    api.get<{ payments: Payment[] }>(`/invoices/${invoiceId}/payments`).then((r) => r.data.payments),
  collectPayment: (invoiceId: string, data: CollectPaymentPayload) =>
    api
      .post<{ payment: Payment; invoice: InvoiceRecord }>(`/invoices/${invoiceId}/payments`, data)
      .then((r) => r.data),
  downloadPdf: (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: "blob" }).then((r) => r.data as Blob),
  getStudentLedger: (studentId: string) =>
    api
      .get<{ studentId: string; invoices: InvoiceRecord[]; totalBilled: number; totalPaid: number; totalOutstanding: number }>(
        `/invoices/students/${studentId}/ledger`
      )
      .then((r) => r.data),
  downloadNoDuesCertificate: (studentId: string) =>
    api
      .get(`/invoices/students/${studentId}/no-dues-certificate/pdf`, { responseType: "blob" })
      .then((r) => r.data as Blob),
};
