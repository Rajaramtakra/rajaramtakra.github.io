import { api } from "@/lib/api";
import type { PaginatedResult } from "@erp/shared";

export interface AdmissionGuardian {
  id: string;
  fullName: string;
  relation: string;
  phone: string;
  email?: string | null;
  occupation?: string | null;
  isPrimary: boolean;
}

export interface AdmissionDocument {
  id: string;
  category: string;
  fileName: string;
  filePath: string;
  createdAt: string;
}

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  status: "DRAFT" | "SUBMITTED" | "REVIEW" | "APPROVED" | "REJECTED" | "ENROLLED";
  classAppliedForId: string;
  academicSessionId: string;
  classAppliedFor?: { id: string; name: string };
  academicSession?: { id: string; name: string };
  reviewNotes?: string | null;
  decisionNotes?: string | null;
  guardians: AdmissionGuardian[];
  documents: AdmissionDocument[];
  createdAt: string;
}

export interface CreateAdmissionPayload {
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address: string;
  classAppliedForId: string;
  academicSessionId: string;
  guardians: { fullName: string; relation: string; phone: string; email?: string; isPrimary: boolean }[];
}

export const admissionApi = {
  list: (params: { page?: number; pageSize?: number; search?: string; status?: string }) =>
    api
      .get<PaginatedResult<AdmissionApplication>>("/admissions", { params })
      .then((r) => r.data),
  get: (id: string) => api.get<{ application: AdmissionApplication }>(`/admissions/${id}`).then((r) => r.data.application),
  create: (data: CreateAdmissionPayload) =>
    api.post<{ application: AdmissionApplication }>("/admissions", data).then((r) => r.data.application),
  submit: (id: string) => api.post(`/admissions/${id}/submit`),
  review: (id: string, notes?: string) => api.post(`/admissions/${id}/review`, { notes }),
  decide: (id: string, decision: "APPROVED" | "REJECTED", notes?: string) =>
    api.post(`/admissions/${id}/decide`, { decision, notes }),
  enroll: (id: string, sectionId: string) => api.post(`/admissions/${id}/enroll`, { sectionId }),
  uploadDocument: (id: string, category: string, file: File) => {
    const form = new FormData();
    form.append("category", category);
    form.append("file", file);
    return api.post(`/admissions/${id}/documents`, form, { headers: { "Content-Type": "multipart/form-data" } });
  },
};
