import { api } from "@/lib/api";

export interface TimetableEntryRecord {
  id: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: string;
  periodId?: string | null;
  startTime: string;
  endTime: string;
  room?: string | null;
  section: { id: string; name: string; class: { id: string; name: string } };
  subject: { id: string; name: string; code: string };
  teacher: { id: string; firstName: string; lastName: string; employeeCode: string };
}

export interface PeriodRecord {
  id: string;
  name: string;
  order: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export const timetableApi = {
  listBySection: (sectionId: string) =>
    api.get<{ entries: TimetableEntryRecord[] }>(`/timetable/section/${sectionId}`).then((r) => r.data.entries),
  listByTeacher: (teacherId: string) =>
    api.get<{ entries: TimetableEntryRecord[] }>(`/timetable/teacher/${teacherId}`).then((r) => r.data.entries),
  listMine: () => api.get<{ entries: TimetableEntryRecord[] }>("/timetable/me").then((r) => r.data.entries),
  create: (data: {
    sectionId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: string;
    periodId?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
  }) => api.post<{ entry: TimetableEntryRecord }>("/timetable", data).then((r) => r.data.entry),
  update: (
    id: string,
    data: Partial<{
      subjectId: string;
      teacherId: string;
      dayOfWeek: string;
      periodId: string;
      startTime: string;
      endTime: string;
      room: string;
    }>
  ) => api.patch<{ entry: TimetableEntryRecord }>(`/timetable/${id}`, data).then((r) => r.data.entry),
  remove: (id: string) => api.delete(`/timetable/${id}`),

  listPeriods: () => api.get<{ periods: PeriodRecord[] }>("/timetable/periods").then((r) => r.data.periods),
  createPeriod: (data: { name: string; order: number; startTime: string; endTime: string; isBreak?: boolean }) =>
    api.post<{ period: PeriodRecord }>("/timetable/periods", data).then((r) => r.data.period),
  updatePeriod: (id: string, data: Partial<{ name: string; order: number; startTime: string; endTime: string; isBreak: boolean }>) =>
    api.patch<{ period: PeriodRecord }>(`/timetable/periods/${id}`, data).then((r) => r.data.period),
  deletePeriod: (id: string) => api.delete(`/timetable/periods/${id}`),
};
