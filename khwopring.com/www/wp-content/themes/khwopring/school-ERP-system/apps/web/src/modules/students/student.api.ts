import { api } from "@/lib/api";
import type { PaginatedResult } from "@erp/shared";

export interface StudentGuardianLink {
  id: string;
  relation: string;
  isPrimary: boolean;
  guardian: {
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
    occupation?: string | null;
    userId?: string | null;
  };
}

export interface EmergencyContact {
  id: string;
  fullName: string;
  relation: string;
  phone: string;
}

export interface StudentRecord {
  id: string;
  userId?: string | null;
  registrationNumber: string;
  rollNumber?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string | null;
  address: string;
  medicalNotes?: string | null;
  phone?: string | null;
  email?: string | null;
  status: "ACTIVE" | "SUSPENDED" | "RUSTICATED" | "TRANSFERRED" | "ALUMNI" | "EXPELLED";
  admissionDate: string;
  suspensionReason?: string | null;
  photoUrl?: string | null;
  section: { id: string; name: string; class: { id: string; name: string } };
  academicSession: { id: string; name: string };
  guardians: StudentGuardianLink[];
  emergencyContacts: EmergencyContact[];
}

export const studentApi = {
  search: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    classId?: string;
    sectionId?: string;
  }) => api.get<PaginatedResult<StudentRecord>>("/students", { params }).then((r) => r.data),
  get: (id: string) => api.get<{ student: StudentRecord }>(`/students/${id}`).then((r) => r.data.student),
  updateProfile: (id: string, data: Partial<StudentRecord>) => api.patch(`/students/${id}`, data),
  uploadPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<{ student: StudentRecord }>(`/students/${id}/photo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.student);
  },
  addGuardian: (
    id: string,
    data: { fullName: string; relation: string; phone: string; email?: string; isPrimary: boolean }
  ) => api.post(`/students/${id}/guardians`, data),
  suspend: (id: string, reason: string) => api.post(`/students/${id}/suspend`, { reason }),
  reinstate: (id: string) => api.post(`/students/${id}/reinstate`, {}),
  rusticate: (id: string, reason: string) => api.post(`/students/${id}/rusticate`, { reason }),
  issueTransferCertificate: (id: string, reason: string) => api.post(`/students/${id}/transfer-certificate`, { reason }),
  convertToAlumni: (id: string, graduationYear: number) =>
    api.post(`/students/${id}/alumni-convert`, { graduationYear }),
  promote: (studentIds: string[], toSectionId: string, toAcademicSessionId: string) =>
    api.post("/students/promote", { studentIds, toSectionId, toAcademicSessionId }),
  enablePortalAccess: (id: string) =>
    api
      .post<{ student: StudentRecord; temporaryPassword: string }>(`/students/${id}/portal-access`)
      .then((r) => r.data),
};
