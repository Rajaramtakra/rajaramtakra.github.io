import { z } from "zod";

export const createHomeworkSchema = z.object({
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  dueDate: z.coerce.date(),
});
export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;

export const updateHomeworkSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  dueDate: z.coerce.date().optional(),
});
export type UpdateHomeworkInput = z.infer<typeof updateHomeworkSchema>;

export const homeworkSearchSchema = z.object({
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
});
export type HomeworkSearchInput = z.infer<typeof homeworkSearchSchema>;
