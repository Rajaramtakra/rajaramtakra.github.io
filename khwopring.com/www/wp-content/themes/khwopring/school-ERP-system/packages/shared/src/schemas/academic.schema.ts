import { z } from "zod";

export const createAcademicSessionSchema = z.object({
  name: z.string().min(2).max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isCurrent: z.boolean().optional(),
});
export type CreateAcademicSessionInput = z.infer<typeof createAcademicSessionSchema>;

export const createClassSchema = z.object({
  name: z.string().min(1).max(50),
  academicSessionId: z.string().min(1),
  order: z.coerce.number().int().min(0).default(0),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;

export const createSectionSchema = z.object({
  name: z.string().min(1).max(20),
  classId: z.string().min(1),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
  classTeacherId: z.string().min(1).optional(),
});
export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  isElective: z.boolean().default(false),
});
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const assignSubjectSchema = z.object({
  subjectId: z.string().min(1),
  sectionId: z.string().min(1),
  teacherId: z.string().min(1),
});
export type AssignSubjectInput = z.infer<typeof assignSubjectSchema>;

export const assignSectionCoordinatorSchema = z.object({
  coordinatorTeacherId: z.string().min(1).nullable(),
});
export type AssignSectionCoordinatorInput = z.infer<typeof assignSectionCoordinatorSchema>;

// ---------------------------------------------------------------------------
// Syllabus & chapters
// ---------------------------------------------------------------------------

export const createSyllabusSchema = z.object({
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  academicSessionId: z.string().min(1),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
});
export type CreateSyllabusInput = z.infer<typeof createSyllabusSchema>;

export const updateSyllabusSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
});
export type UpdateSyllabusInput = z.infer<typeof updateSyllabusSchema>;

export const createChapterSchema = z.object({
  title: z.string().min(1).max(200),
  order: z.coerce.number().int().min(0).default(0),
  description: z.string().max(2000).optional(),
});
export type CreateChapterInput = z.infer<typeof createChapterSchema>;

export const updateChapterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  order: z.coerce.number().int().min(0).optional(),
  description: z.string().max(2000).optional(),
  isCompleted: z.boolean().optional(),
});
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
