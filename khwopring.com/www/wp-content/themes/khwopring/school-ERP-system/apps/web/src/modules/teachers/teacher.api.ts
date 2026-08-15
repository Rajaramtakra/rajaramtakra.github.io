import { api } from "@/lib/api";
import type { PaginatedResult } from "@erp/shared";

export interface TeacherQualification {
  id: string;
  degree: string;
  institution: string;
  yearCompleted: number;
}

export interface TeacherExperience {
  id: string;
  organization: string;
  role: string;
  fromDate: string;
  toDate?: string | null;
  description?: string | null;
}

export interface TeacherSubjectAssignment {
  id: string;
  subject: { id: string; name: string; code: string };
  section: { id: string; name: string; class: { id: string; name: string } };
}

export interface TeacherRecord {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  dateOfJoining: string;
  specialization?: string | null;
  address?: string | null;
  employmentStatus: "ACTIVE" | "ON_LEAVE" | "TERMINATED" | "RESIGNED" | "RETIRED";
  photoUrl?: string | null;
  qualifications: TeacherQualification[];
  experiences: TeacherExperience[];
  subjectAssignments?: TeacherSubjectAssignment[];
  user: { email: string; isActive: boolean; lastLoginAt?: string | null };
}

export const teacherApi = {
  search: (params: { page?: number; pageSize?: number; search?: string; employmentStatus?: string }) =>
    api.get<PaginatedResult<TeacherRecord>>("/teachers", { params }).then((r) => r.data),
  get: (id: string) => api.get<{ teacher: TeacherRecord }>(`/teachers/${id}`).then((r) => r.data.teacher),
  getMyProfile: () => api.get<{ teacher: TeacherRecord }>("/teachers/me").then((r) => r.data.teacher),
  create: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfJoining: string;
    specialization?: string;
    address?: string;
  }) => api.post<{ teacher: TeacherRecord; temporaryPassword: string }>("/teachers", data).then((r) => r.data),
  update: (id: string, data: Partial<TeacherRecord>) => api.patch(`/teachers/${id}`, data),
  uploadPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<{ teacher: TeacherRecord }>(`/teachers/${id}/photo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.teacher);
  },
  updateStatus: (id: string, employmentStatus: string) => api.post(`/teachers/${id}/status`, { employmentStatus }),
  addQualification: (id: string, data: { degree: string; institution: string; yearCompleted: number }) =>
    api.post(`/teachers/${id}/qualifications`, data),
  addExperience: (
    id: string,
    data: { organization: string; role: string; fromDate: string; toDate?: string; description?: string }
  ) => api.post(`/teachers/${id}/experience`, data),
};
