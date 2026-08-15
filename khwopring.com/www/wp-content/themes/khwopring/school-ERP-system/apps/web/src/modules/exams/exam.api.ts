import { api } from "@/lib/api";

export type ExamTypeValue = "UNIT_TEST" | "MID_TERM" | "FINAL" | "PRACTICAL" | "OTHER";

export interface ExamRecord {
  id: string;
  name: string;
  examType: ExamTypeValue;
  academicSessionId: string;
  startDate: string;
  endDate: string;
  academicSession: { id: string; name: string };
}

export interface ExamScheduleRecord {
  id: string;
  examId: string;
  subjectId: string;
  sectionId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
  exam: { id: string; name: string };
  subject: { id: string; name: string };
  section: { id: string; name: string; class: { id: string; name: string } };
}

export interface GradeScaleRecord {
  id: string;
  name: string;
  minPercent: number;
  maxPercent: number;
  grade: string;
  gpaPoint: number;
}

export interface MarkRecord {
  id: string;
  examScheduleId: string;
  studentId: string;
  marksObtained: number;
  grade: string | null;
  remarks: string | null;
  student: { id: string; firstName: string; lastName: string; registrationNumber: string };
}

export interface ReportCardRecord {
  id: string;
  studentId: string;
  examId: string;
  academicSessionId: string;
  gpa: number | null;
  totalMarks: number | null;
  percentage: number | null;
  rank: number | null;
  publishedAt: string | null;
  filePath: string | null;
  student: { id: string; firstName: string; lastName: string; registrationNumber: string };
  exam: { id: string; name: string };
}

export interface ReportCardSubjectMark {
  id: string;
  marksObtained: number;
  grade: string | null;
  examSchedule: { maxMarks: number; subject: { id: string; name: string } };
}

export interface CoScholasticGradeRecord {
  id: string;
  studentId: string;
  examId: string;
  activity: string;
  grade: string;
  remarks: string | null;
  student: { id: string; firstName: string; lastName: string; registrationNumber: string };
}

export const examApi = {
  listExams: (academicSessionId?: string) =>
    api.get<{ exams: ExamRecord[] }>("/exams", { params: { academicSessionId } }).then((r) => r.data.exams),
  createExam: (data: { name: string; examType: ExamTypeValue; academicSessionId: string; startDate: string; endDate: string }) =>
    api.post<{ exam: ExamRecord }>("/exams", data).then((r) => r.data.exam),
  getExam: (id: string) => api.get<{ exam: ExamRecord }>(`/exams/${id}`).then((r) => r.data.exam),

  listSchedules: (params: { examId?: string; sectionId?: string }) =>
    api.get<{ schedules: ExamScheduleRecord[] }>("/exams/schedules", { params }).then((r) => r.data.schedules),
  createSchedule: (data: {
    examId: string;
    subjectId: string;
    sectionId: string;
    examDate: string;
    startTime: string;
    endTime: string;
    maxMarks: number;
    passingMarks: number;
  }) => api.post<{ schedule: ExamScheduleRecord }>("/exams/schedules", data).then((r) => r.data.schedule),

  listGradeScales: () => api.get<{ gradeScales: GradeScaleRecord[] }>("/exams/grade-scales").then((r) => r.data.gradeScales),
  createGradeScale: (data: { name: string; minPercent: number; maxPercent: number; grade: string; gpaPoint: number }) =>
    api.post<{ gradeScale: GradeScaleRecord }>("/exams/grade-scales", data).then((r) => r.data.gradeScale),

  listMarks: (examScheduleId: string) =>
    api.get<{ marks: MarkRecord[] }>("/exams/marks", { params: { examScheduleId } }).then((r) => r.data.marks),
  enterMarks: (data: { examScheduleId: string; entries: { studentId: string; marksObtained: number; remarks?: string }[] }) =>
    api.post<{ marks: MarkRecord[] }>("/exams/marks", data).then((r) => r.data.marks),

  listReportCards: (params: { examId?: string; sectionId?: string }) =>
    api.get<{ reportCards: ReportCardRecord[] }>("/exams/report-cards", { params }).then((r) => r.data.reportCards),
  getReportCard: (id: string) =>
    api
      .get<{ reportCard: ReportCardRecord; subjectMarks: ReportCardSubjectMark[] }>(`/exams/report-cards/${id}`)
      .then((r) => r.data),
  publishReportCards: (data: { examId: string; sectionId: string }) =>
    api.post<{ reportCards: ReportCardRecord[] }>("/exams/report-cards/publish", data).then((r) => r.data.reportCards),

  downloadAdmitCardsPdf: (examId: string, sectionId: string) =>
    api.get(`/exams/${examId}/sections/${sectionId}/admit-cards/bulk-pdf`, { responseType: "blob" }).then((r) => r.data as Blob),

  listCoScholasticGrades: (params: { examId?: string; studentId?: string }) =>
    api.get<{ grades: CoScholasticGradeRecord[] }>("/exams/co-scholastic", { params }).then((r) => r.data.grades),
  upsertCoScholasticGrade: (data: { studentId: string; examId: string; activity: string; grade: string; remarks?: string }) =>
    api.post<{ grade: CoScholasticGradeRecord }>("/exams/co-scholastic", data).then((r) => r.data.grade),
};
