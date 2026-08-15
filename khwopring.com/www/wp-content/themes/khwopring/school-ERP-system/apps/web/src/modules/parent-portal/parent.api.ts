import { api } from "@/lib/api";

export interface ChildRecord {
  id: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  status: string;
  section: { id: string; name: string; class: { id: string; name: string } };
  academicSession: { id: string; name: string };
  relation: string;
  isPrimary: boolean;
}

export interface ChildAttendanceRecord {
  id: string;
  date: string;
  status: string;
  remarks?: string | null;
  section: { name: string; class: { name: string } };
}

export interface ChildHomeworkRecord {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  attachmentUrl?: string | null;
  subject: { name: string };
  teacher: { firstName: string; lastName: string };
}

export interface ChildTimetableEntry {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  subject: { name: string };
  teacher: { firstName: string; lastName: string };
}

export const parentApi = {
  listMyChildren: () => api.get<{ children: ChildRecord[] }>("/parents/children").then((r) => r.data.children),
  getChildAttendance: (studentId: string) =>
    api
      .get<{ records: ChildAttendanceRecord[] }>(`/parents/children/${studentId}/attendance`)
      .then((r) => r.data.records),
  getChildHomework: (studentId: string) =>
    api.get<{ homework: ChildHomeworkRecord[] }>(`/parents/children/${studentId}/homework`).then((r) => r.data.homework),
  getChildTimetable: (studentId: string) =>
    api.get<{ entries: ChildTimetableEntry[] }>(`/parents/children/${studentId}/timetable`).then((r) => r.data.entries),
  enableGuardianPortalAccess: (guardianId: string) =>
    api
      .post<{ temporaryPassword: string }>(`/parents/guardians/${guardianId}/enable-access`)
      .then((r) => r.data),
};
