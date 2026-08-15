import { api } from "@/lib/api";

export interface LessonPlanRecord {
  id: string;
  title: string;
  content: string;
  plannedDate: string;
  section: { id: string; name: string; class: { id: string; name: string } };
  subject: { id: string; name: string };
}

export interface LessonPlanInput {
  sectionId: string;
  subjectId: string;
  title: string;
  content: string;
  plannedDate: string;
}

export const lessonPlanApi = {
  list: (params: { sectionId?: string; subjectId?: string }) =>
    api.get<{ lessonPlans: LessonPlanRecord[] }>("/lesson-plans", { params }).then((r) => r.data.lessonPlans),
  create: (data: LessonPlanInput) =>
    api.post<{ lessonPlan: LessonPlanRecord }>("/lesson-plans", data).then((r) => r.data.lessonPlan),
  update: (id: string, data: Partial<LessonPlanInput>) =>
    api.patch<{ lessonPlan: LessonPlanRecord }>(`/lesson-plans/${id}`, data).then((r) => r.data.lessonPlan),
  remove: (id: string) => api.delete(`/lesson-plans/${id}`),
};
