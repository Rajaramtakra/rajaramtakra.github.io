import { api } from "@/lib/api";

export type EnquiryStatus = "NEW" | "FOLLOW_UP" | "CONVERTED" | "CLOSED";

export interface Enquiry {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  interestedClassId?: string | null;
  interestedClass?: { id: string; name: string } | null;
  source?: string | null;
  status: EnquiryStatus;
  followUpDate?: string | null;
  remarks?: string | null;
  convertedAdmissionApplicationId?: string | null;
  createdAt: string;
}

export interface CreateEnquiryPayload {
  fullName: string;
  phone: string;
  email?: string;
  interestedClassId?: string;
  source?: string;
  followUpDate?: string;
  remarks?: string;
}

export interface ConvertEnquiryPayload {
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address: string;
  classAppliedForId: string;
  academicSessionId: string;
  isRte?: boolean;
  rteCategory?: string;
  guardians: Array<{ fullName: string; relation: string; phone: string; isPrimary: boolean }>;
}

export type StudentRequestStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface StudentRequest {
  id: string;
  studentId: string;
  student: { id: string; firstName: string; lastName: string; registrationNumber: string };
  category: string;
  subject: string;
  description: string;
  status: StudentRequestStatus;
  createdAt: string;
}

export interface CreateStudentRequestPayload {
  studentId: string;
  category: string;
  subject: string;
  description: string;
}

export interface PtmMeeting {
  id: string;
  title: string;
  scheduledAt: string;
  venue?: string | null;
  notes?: string | null;
  sectionId?: string | null;
  section?: { id: string; name: string; class: { name: string } } | null;
  _count?: { attendances: number };
}

export interface PtmAttendance {
  studentId: string;
  guardianId?: string | null;
  attended: boolean;
  remarks?: string | null;
  student: { id: string; firstName: string; lastName: string; registrationNumber: string };
  guardian?: { id: string; fullName: string } | null;
}

export interface PtmMeetingDetail extends PtmMeeting {
  attendances: PtmAttendance[];
}

export interface Sibling {
  id: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  section: { name: string; class: { name: string } };
}

export const receptionApi = {
  listEnquiries: (status?: string) =>
    api.get<{ enquiries: Enquiry[] }>("/reception/enquiries", { params: { status } }).then((r) => r.data.enquiries),
  createEnquiry: (data: CreateEnquiryPayload) =>
    api.post<{ enquiry: Enquiry }>("/reception/enquiries", data).then((r) => r.data.enquiry),
  updateEnquiry: (id: string, data: Partial<CreateEnquiryPayload & { status: EnquiryStatus }>) =>
    api.patch<{ enquiry: Enquiry }>(`/reception/enquiries/${id}`, data).then((r) => r.data.enquiry),
  convertEnquiry: (id: string, data: ConvertEnquiryPayload) =>
    api.post<{ enquiry: Enquiry; application: { id: string } }>(`/reception/enquiries/${id}/convert`, data).then((r) => r.data),

  getSiblings: (studentId: string) =>
    api.get<{ siblings: Sibling[] }>(`/reception/students/${studentId}/siblings`).then((r) => r.data.siblings),

  listStudentRequests: (params: { status?: string; studentId?: string }) =>
    api.get<{ requests: StudentRequest[] }>("/reception/student-requests", { params }).then((r) => r.data.requests),
  createStudentRequest: (data: CreateStudentRequestPayload) =>
    api.post<{ request: StudentRequest }>("/reception/student-requests", data).then((r) => r.data.request),
  updateStudentRequestStatus: (id: string, status: StudentRequestStatus) =>
    api.patch<{ request: StudentRequest }>(`/reception/student-requests/${id}`, { status }).then((r) => r.data.request),

  listPtmMeetings: (sectionId?: string) =>
    api.get<{ meetings: PtmMeeting[] }>("/reception/ptm-meetings", { params: { sectionId } }).then((r) => r.data.meetings),
  createPtmMeeting: (data: {
    title: string;
    scheduledAt: string;
    sectionId?: string;
    venue?: string;
    notes?: string;
    studentIds: string[];
  }) => api.post<{ meeting: PtmMeeting }>("/reception/ptm-meetings", data).then((r) => r.data.meeting),
  getPtmMeeting: (id: string) =>
    api.get<{ meeting: PtmMeetingDetail }>(`/reception/ptm-meetings/${id}`).then((r) => r.data.meeting),
  recordPtmAttendance: (
    id: string,
    attendances: Array<{ studentId: string; guardianId?: string; attended: boolean; remarks?: string }>
  ) => api.post(`/reception/ptm-meetings/${id}/attendance`, { attendances }),
};
