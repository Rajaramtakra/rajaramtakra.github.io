import { api } from "@/lib/api";

export type AttendanceStatusValue = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "EXCUSED";

export interface StudentAttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatusValue;
  remarks?: string | null;
  student: { id: string; firstName: string; lastName: string; registrationNumber: string };
  section: { id: string; name: string; class: { id: string; name: string } };
}

export interface StaffAttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatusValue;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  teacher?: { id: string; firstName: string; lastName: string } | null;
  staff?: { id: string; firstName: string; lastName: string } | null;
}

export const attendanceApi = {
  markStudents: (data: {
    sectionId: string;
    date: string;
    entries: { studentId: string; status: AttendanceStatusValue; remarks?: string }[];
  }) => api.post("/attendance/students", data),
  listStudents: (params: { sectionId?: string; studentId?: string; date?: string; fromDate?: string; toDate?: string }) =>
    api.get<{ records: StudentAttendanceRecord[] }>("/attendance/students", { params }).then((r) => r.data.records),
  markStaff: (data: {
    teacherId?: string;
    staffId?: string;
    date: string;
    status: AttendanceStatusValue;
    checkInAt?: string;
    checkOutAt?: string;
  }) => api.post("/attendance/staff", data),
  listStaff: (params: { teacherId?: string; staffId?: string; date?: string; fromDate?: string; toDate?: string }) =>
    api.get<{ records: StaffAttendanceRecord[] }>("/attendance/staff", { params }).then((r) => r.data.records),
};
