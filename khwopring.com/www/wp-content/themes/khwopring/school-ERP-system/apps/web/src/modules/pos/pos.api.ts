import { api } from "@/lib/api";

export type SaleStatus = "DRAFT" | "COMPLETED" | "CANCELLED" | "REFUNDED";
export type SalePaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | "ONLINE";

export interface SaleItemRecord {
  id: string;
  inventoryItemId: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
  inventoryItem: { id: string; name: string; unit: string };
}

export interface SalePaymentRecord {
  id: string;
  saleId: string;
  amount: number | string;
  method: SalePaymentMethod;
  transactionRef?: string | null;
  receiptNumber?: string | null;
  filePath?: string | null;
  paidAt: string;
}

export interface SaleRecord {
  id: string;
  saleNumber: string;
  counterpartyId?: string | null;
  status: SaleStatus;
  totalAmount: number | string;
  paidAmount: number | string;
  soldById: string;
  createdAt: string;
  counterparty?: { id: string; name: string } | null;
  soldBy: { id: string; fullName: string };
  items: SaleItemRecord[];
  payments: SalePaymentRecord[];
}

export const posApi = {
  createSale: (data: {
    counterpartyId?: string;
    items: Array<{ inventoryItemId: string; description: string; quantity: number; unitPrice: number }>;
  }) => api.post<{ sale: SaleRecord }>("/pos/sales", data).then((r) => r.data.sale),

  listSales: (params?: { status?: SaleStatus }) =>
    api.get<{ sales: SaleRecord[] }>("/pos/sales", { params }).then((r) => r.data.sales),

  getSale: (id: string) => api.get<{ sale: SaleRecord }>(`/pos/sales/${id}`).then((r) => r.data.sale),

  cancelSale: (id: string) => api.post<{ sale: SaleRecord }>(`/pos/sales/${id}/cancel`).then((r) => r.data.sale),

  collectPayment: (id: string, data: { amount: number; method: SalePaymentMethod; transactionRef?: string }) =>
    api
      .post<{ payment: SalePaymentRecord; sale: SaleRecord }>(`/pos/sales/${id}/payments`, data)
      .then((r) => r.data),

  listPayments: (id: string) =>
    api.get<{ payments: SalePaymentRecord[] }>(`/pos/sales/${id}/payments`).then((r) => r.data.payments),
};
