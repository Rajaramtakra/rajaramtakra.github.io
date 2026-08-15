import { api } from "@/lib/api";

export interface HomeworkRecord {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  attachmentUrl?: string | null;
  section: { id: string; name: string; class: { id: string; name: string } };
  subject: { id: string; name: string };
  teacher: { id: string; firstName: string; lastName: string };
}

export interface HomeworkInput {
  sectionId: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
}

function toFormData(data: Partial<HomeworkInput>, file?: File) {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) form.append(key, String(value));
  });
  if (file) form.append("file", file);
  return form;
}

export const homeworkApi = {
  list: (params: { sectionId?: string; subjectId?: string }) =>
    api.get<{ homework: HomeworkRecord[] }>("/homework", { params }).then((r) => r.data.homework),
  get: (id: string) => api.get<{ homework: HomeworkRecord }>(`/homework/${id}`).then((r) => r.data.homework),
  create: (data: HomeworkInput, file?: File) =>
    api
      .post<{ homework: HomeworkRecord }>("/homework", file ? toFormData(data, file) : data)
      .then((r) => r.data.homework),
  update: (id: string, data: Partial<HomeworkInput>, file?: File) =>
    api
      .patch<{ homework: HomeworkRecord }>(`/homework/${id}`, file ? toFormData(data, file) : data)
      .then((r) => r.data.homework),
  remove: (id: string) => api.delete(`/homework/${id}`),
};
