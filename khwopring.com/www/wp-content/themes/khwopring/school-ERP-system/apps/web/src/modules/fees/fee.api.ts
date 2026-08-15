import { api } from "@/lib/api";

export interface FeeCategory {
  id: string;
  name: string;
  description?: string | null;
}

export interface FeeStructure {
  id: string;
  classId: string;
  feeCategoryId: string;
  academicSessionId: string;
  amount: number | string;
  frequency: "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
  class: { id: string; name: string };
  feeCategory: FeeCategory;
  academicSession: { id: string; name: string };
}

export interface Discount {
  id: string;
  studentId: string;
  feeStructureId?: string | null;
  type: "PERCENT" | "FIXED";
  value: number | string;
  reason: string;
  approvedById: string;
  createdAt: string;
  feeStructure?: { id: string; feeCategory: FeeCategory } | null;
}

export interface Scholarship {
  id: string;
  studentId: string;
  name: string;
  amount: number | string;
  academicSessionId: string;
  approvedById: string;
  createdAt: string;
}

export type FineStatus = "PENDING" | "PAID" | "WAIVED";

export interface Fine {
  id: string;
  studentId: string;
  reason: string;
  amount: number | string;
  status: FineStatus;
  createdAt: string;
}

export const feeApi = {
  listCategories: () => api.get<{ feeCategories: FeeCategory[] }>("/fees/categories").then((r) => r.data.feeCategories),
  createCategory: (data: { name: string; description?: string }) =>
    api.post<{ feeCategory: FeeCategory }>("/fees/categories", data).then((r) => r.data.feeCategory),

  listStructures: (filters?: { classId?: string; academicSessionId?: string }) =>
    api
      .get<{ feeStructures: FeeStructure[] }>("/fees/structures", { params: filters })
      .then((r) => r.data.feeStructures),
  createStructure: (data: {
    classId: string;
    feeCategoryId: string;
    academicSessionId: string;
    amount: number;
    frequency: string;
  }) => api.post<{ feeStructure: FeeStructure }>("/fees/structures", data).then((r) => r.data.feeStructure),

  listDiscounts: (studentId?: string) =>
    api.get<{ discounts: Discount[] }>("/fees/discounts", { params: { studentId } }).then((r) => r.data.discounts),
  createDiscount: (data: {
    studentId: string;
    feeStructureId?: string;
    type: string;
    value: number;
    reason: string;
  }) => api.post<{ discount: Discount }>("/fees/discounts", data).then((r) => r.data.discount),

  listScholarships: (studentId?: string) =>
    api
      .get<{ scholarships: Scholarship[] }>("/fees/scholarships", { params: { studentId } })
      .then((r) => r.data.scholarships),
  createScholarship: (data: { studentId: string; name: string; amount: number; academicSessionId: string }) =>
    api.post<{ scholarship: Scholarship }>("/fees/scholarships", data).then((r) => r.data.scholarship),

  listFines: (studentId?: string) =>
    api.get<{ fines: Fine[] }>("/fees/fines", { params: { studentId } }).then((r) => r.data.fines),
  createFine: (data: { studentId: string; reason: string; amount: number }) =>
    api.post<{ fine: Fine }>("/fees/fines", data).then((r) => r.data.fine),
  waiveFine: (id: string) => api.post<{ fine: Fine }>(`/fees/fines/${id}/waive`).then((r) => r.data.fine),
  markFinePaid: (id: string) => api.post<{ fine: Fine }>(`/fees/fines/${id}/mark-paid`).then((r) => r.data.fine),
};
