import { api } from "@/lib/api";

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface ClassRecord {
  id: string;
  name: string;
  order: number;
  academicSessionId: string;
  sections: SectionRecord[];
}

export interface SectionRecord {
  id: string;
  name: string;
  classId: string;
  capacity: number | null;
  classTeacherId?: string | null;
  coordinatorTeacherId?: string | null;
  class?: { id: string; name: string };
  classTeacher?: { id: string; firstName: string; lastName: string } | null;
  coordinatorTeacher?: { id: string; firstName: string; lastName: string } | null;
  _count?: { students: number };
}

export interface SubjectRecord {
  id: string;
  name: string;
  code: string;
  isElective: boolean;
}

export interface ChapterRecord {
  id: string;
  syllabusId: string;
  title: string;
  order: number;
  description?: string | null;
  isCompleted: boolean;
}

export interface SyllabusRecord {
  id: string;
  subjectId: string;
  classId: string;
  academicSessionId: string;
  title: string;
  description?: string | null;
  subject: { id: string; name: string; code: string };
  class: { id: string; name: string };
  academicSession: { id: string; name: string };
  chapters: ChapterRecord[];
}

export const academicApi = {
  listSessions: () => api.get<{ sessions: AcademicSession[] }>("/academic/sessions").then((r) => r.data.sessions),
  createSession: (data: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) =>
    api.post("/academic/sessions", data),
  setCurrentSession: (id: string) => api.patch(`/academic/sessions/${id}/set-current`),

  listClasses: (academicSessionId?: string) =>
    api
      .get<{ classes: ClassRecord[] }>("/academic/classes", { params: { academicSessionId } })
      .then((r) => r.data.classes),
  createClass: (data: { name: string; academicSessionId: string; order?: number }) => api.post("/academic/classes", data),

  listSections: (classId?: string) =>
    api.get<{ sections: SectionRecord[] }>("/academic/sections", { params: { classId } }).then((r) => r.data.sections),
  createSection: (data: { name: string; classId: string; capacity?: number }) => api.post("/academic/sections", data),
  assignSectionCoordinator: (sectionId: string, coordinatorTeacherId: string | null) =>
    api
      .patch<{ section: SectionRecord }>(`/academic/sections/${sectionId}/coordinator`, { coordinatorTeacherId })
      .then((r) => r.data.section),

  listSubjects: () => api.get<{ subjects: SubjectRecord[] }>("/academic/subjects").then((r) => r.data.subjects),
  createSubject: (data: { name: string; code: string; isElective?: boolean }) => api.post("/academic/subjects", data),

  listSyllabi: (filters?: { classId?: string; subjectId?: string; academicSessionId?: string }) =>
    api.get<{ syllabi: SyllabusRecord[] }>("/academic/syllabi", { params: filters }).then((r) => r.data.syllabi),
  createSyllabus: (data: { subjectId: string; classId: string; academicSessionId: string; title: string; description?: string }) =>
    api.post<{ syllabus: SyllabusRecord }>("/academic/syllabi", data).then((r) => r.data.syllabus),
  createChapter: (syllabusId: string, data: { title: string; order?: number; description?: string }) =>
    api.post<{ chapter: ChapterRecord }>(`/academic/syllabi/${syllabusId}/chapters`, data).then((r) => r.data.chapter),
  updateChapter: (id: string, data: Partial<{ title: string; order: number; description: string; isCompleted: boolean }>) =>
    api.patch<{ chapter: ChapterRecord }>(`/academic/chapters/${id}`, data).then((r) => r.data.chapter),
  deleteChapter: (id: string) => api.delete(`/academic/chapters/${id}`),
};
