import { z } from "zod";

export const createLessonPlanSchema = z.object({
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  plannedDate: z.coerce.date(),
});
export type CreateLessonPlanInput = z.infer<typeof createLessonPlanSchema>;

export const updateLessonPlanSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  plannedDate: z.coerce.date().optional(),
});
export type UpdateLessonPlanInput = z.infer<typeof updateLessonPlanSchema>;

export const lessonPlanSearchSchema = z.object({
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
});
export type LessonPlanSearchInput = z.infer<typeof lessonPlanSearchSchema>;
