import { api } from "@/lib/api";
import type { PaginatedResult } from "@erp/shared";

export type JobPostingStatusValue = "OPEN" | "CLOSED" | "ON_HOLD";
export type CandidateApplicationStatusValue =
  | "APPLIED"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEWED"
  | "OFFERED"
  | "REJECTED"
  | "WITHDRAWN"
  | "HIRED";
export type InterviewStatusValue = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type InterviewRecommendationValue = "STRONG_YES" | "YES" | "NO" | "STRONG_NO";
export type LeaveStatusValue = "PENDING" | "APPROVED" | "REJECTED";
export type EmploymentStatusValue = "ACTIVE" | "ON_LEAVE" | "TERMINATED" | "RESIGNED" | "RETIRED";

export interface JobPostingRecord {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements?: string | null;
  status: JobPostingStatusValue;
  openings: number;
  createdAt: string;
  _count?: { applications: number };
  applications?: CandidateApplicationRecord[];
}

export interface CandidateRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  resumeUrl?: string | null;
  createdAt: string;
  applications?: CandidateApplicationRecord[];
}

export interface InterviewFeedbackRecord {
  id: string;
  interviewId: string;
  rating: number;
  recommendation: InterviewRecommendationValue;
  comments?: string | null;
  createdAt: string;
}

export interface InterviewRecord {
  id: string;
  candidateApplicationId: string;
  scheduledAt: string;
  mode?: string | null;
  interviewerId: string;
  status: InterviewStatusValue;
  interviewer?: { id: string; firstName: string; lastName: string };
  feedback?: InterviewFeedbackRecord | null;
}

export interface OfferLetterRecord {
  id: string;
  candidateApplicationId: string;
  position: string;
  salaryOffered: string | number;
  joiningDate: string;
  issuedById: string;
  issuedAt: string;
  filePath?: string | null;
  acceptedAt?: string | null;
}

export interface CandidateApplicationRecord {
  id: string;
  jobPostingId: string;
  candidateId: string;
  status: CandidateApplicationStatusValue;
  appliedAt: string;
  createdAt: string;
  candidate: CandidateRecord;
  jobPosting: JobPostingRecord;
  interviews?: InterviewRecord[];
  offerLetter?: OfferLetterRecord | null;
}

export interface StaffMemberRecord {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  department: string;
  designation: string;
  dateOfJoining: string;
  employmentStatus: EmploymentStatusValue;
  photoUrl?: string | null;
  user: { email: string; isActive: boolean; lastLoginAt?: string | null };
}

export interface StaffPromotionHistoryRecord {
  id: string;
  staffId: string;
  fromDesignation: string;
  toDesignation: string;
  fromDepartment: string;
  toDepartment: string;
  remarks?: string | null;
  promotedById: string;
  promotedAt: string;
}

export interface LeaveRequestRecord {
  id: string;
  teacherId?: string | null;
  staffId?: string | null;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatusValue;
  approvedById?: string | null;
  createdAt: string;
  teacher?: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
  staff?: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
}

export const hrApi = {
  jobPostings: {
    list: (params: { page?: number; pageSize?: number; search?: string; status?: string }) =>
      api.get<PaginatedResult<JobPostingRecord>>("/hr/job-postings", { params }).then((r) => r.data),
    get: (id: string) => api.get<{ jobPosting: JobPostingRecord }>(`/hr/job-postings/${id}`).then((r) => r.data.jobPosting),
    create: (data: { title: string; department: string; description: string; requirements?: string; openings: number }) =>
      api.post<{ jobPosting: JobPostingRecord }>("/hr/job-postings", data).then((r) => r.data.jobPosting),
    update: (id: string, data: Partial<JobPostingRecord>) => api.patch(`/hr/job-postings/${id}`, data),
    updateStatus: (id: string, status: JobPostingStatusValue) => api.post(`/hr/job-postings/${id}/status`, { status }),
  },

  candidates: {
    list: (params: { page?: number; pageSize?: number; search?: string }) =>
      api.get<PaginatedResult<CandidateRecord>>("/hr/candidates", { params }).then((r) => r.data),
    get: (id: string) => api.get<{ candidate: CandidateRecord }>(`/hr/candidates/${id}`).then((r) => r.data.candidate),
    create: (data: { fullName: string; email: string; phone: string; resumeUrl?: string }) =>
      api.post<{ candidate: CandidateRecord }>("/hr/candidates", data).then((r) => r.data.candidate),
    uploadResume: (id: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api
        .post<{ candidate: CandidateRecord }>(`/hr/candidates/${id}/resume`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data.candidate);
    },
  },

  applications: {
    list: (params: { page?: number; pageSize?: number; jobPostingId?: string; candidateId?: string; status?: string }) =>
      api.get<PaginatedResult<CandidateApplicationRecord>>("/hr/applications", { params }).then((r) => r.data),
    get: (id: string) =>
      api.get<{ application: CandidateApplicationRecord }>(`/hr/applications/${id}`).then((r) => r.data.application),
    create: (data: { jobPostingId: string; candidateId: string }) =>
      api.post<{ application: CandidateApplicationRecord }>("/hr/applications", data).then((r) => r.data.application),
    updateStatus: (id: string, status: CandidateApplicationStatusValue) =>
      api
        .post<{ application: CandidateApplicationRecord }>(`/hr/applications/${id}/status`, { status })
        .then((r) => r.data.application),
    issueOfferLetter: (id: string, data: { position: string; salaryOffered: number; joiningDate: string }) =>
      api.post<{ offerLetter: OfferLetterRecord }>(`/hr/applications/${id}/offer-letter`, data).then((r) => r.data.offerLetter),
    acceptOfferLetter: (id: string) =>
      api.post<{ offerLetter: OfferLetterRecord }>(`/hr/applications/${id}/offer-letter/accept`).then((r) => r.data.offerLetter),
    convertToStaff: (id: string) =>
      api
        .post<{ staffMember: StaffMemberRecord; temporaryPassword: string }>(`/hr/applications/${id}/convert-to-staff`)
        .then((r) => r.data),
  },

  interviews: {
    list: (params: { candidateApplicationId?: string }) =>
      api.get<{ interviews: InterviewRecord[] }>("/hr/interviews", { params }).then((r) => r.data.interviews),
    schedule: (data: { candidateApplicationId: string; scheduledAt: string; mode?: string; interviewerId: string }) =>
      api.post<{ interview: InterviewRecord }>("/hr/interviews", data).then((r) => r.data.interview),
    updateStatus: (id: string, status: "CANCELLED" | "NO_SHOW") =>
      api.post(`/hr/interviews/${id}/status`, { status }),
    submitFeedback: (id: string, data: { rating: number; recommendation: InterviewRecommendationValue; comments?: string }) =>
      api.post(`/hr/interviews/${id}/feedback`, data),
  },

  staff: {
    list: (params: { page?: number; pageSize?: number; search?: string; employmentStatus?: string; department?: string }) =>
      api.get<PaginatedResult<StaffMemberRecord>>("/hr/staff", { params }).then((r) => r.data),
    get: (id: string) => api.get<{ staffMember: StaffMemberRecord }>(`/hr/staff/${id}`).then((r) => r.data.staffMember),
    getMyProfile: () => api.get<{ staffMember: StaffMemberRecord }>("/hr/staff/me").then((r) => r.data.staffMember),
    create: (data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      department: string;
      designation: string;
      dateOfJoining: string;
    }) => api.post<{ staffMember: StaffMemberRecord; temporaryPassword: string }>("/hr/staff", data).then((r) => r.data),
    update: (id: string, data: Partial<StaffMemberRecord>) => api.patch(`/hr/staff/${id}`, data),
    updateStatus: (id: string, employmentStatus: string) => api.post(`/hr/staff/${id}/status`, { employmentStatus }),
    promote: (id: string, data: { toDesignation: string; toDepartment: string; remarks?: string }) =>
      api.post<{ staffMember: StaffMemberRecord }>(`/hr/staff/${id}/promote`, data).then((r) => r.data.staffMember),
    promotionHistory: (id: string) =>
      api
        .get<{ promotionHistory: StaffPromotionHistoryRecord[] }>(`/hr/staff/${id}/promotion-history`)
        .then((r) => r.data.promotionHistory),
    uploadPhoto: (id: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api
        .post<{ staffMember: StaffMemberRecord }>(`/hr/staff/${id}/photo`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data.staffMember);
    },
  },

  leaveRequests: {
    create: (data: { teacherId?: string; staffId?: string; leaveType: string; fromDate: string; toDate: string; reason: string }) =>
      api.post<{ leaveRequest: LeaveRequestRecord }>("/hr/leave-requests", data).then((r) => r.data.leaveRequest),
    listAll: (params: { status?: string }) =>
      api.get<{ leaveRequests: LeaveRequestRecord[] }>("/hr/leave-requests", { params }).then((r) => r.data.leaveRequests),
    listMine: () => api.get<{ leaveRequests: LeaveRequestRecord[] }>("/hr/leave-requests/mine").then((r) => r.data.leaveRequests),
    decide: (id: string, decision: "APPROVED" | "REJECTED", comments?: string) =>
      api.post(`/hr/leave-requests/${id}/decide`, { decision, comments }),
  },
};
