import { z } from "zod";
import { EMPLOYMENT_STATUSES } from "../enums";

export const createTeacherSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  dateOfJoining: z.coerce.date(),
  specialization: z.string().max(150).optional(),
  address: z.string().max(300).optional(),
});
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  specialization: z.string().max(150).optional(),
  address: z.string().max(300).optional(),
});
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;

export const updateTeacherStatusSchema = z.object({
  employmentStatus: z.enum(EMPLOYMENT_STATUSES),
});
export type UpdateTeacherStatusInput = z.infer<typeof updateTeacherStatusSchema>;

export const addTeacherQualificationSchema = z.object({
  degree: z.string().min(1).max(150),
  institution: z.string().min(1).max(150),
  yearCompleted: z.coerce.number().int().min(1950).max(2100),
});
export type AddTeacherQualificationInput = z.infer<typeof addTeacherQualificationSchema>;

export const addTeacherExperienceSchema = z.object({
  organization: z.string().min(1).max(150),
  role: z.string().min(1).max(150),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date().optional(),
  description: z.string().max(1000).optional(),
});
export type AddTeacherExperienceInput = z.infer<typeof addTeacherExperienceSchema>;

export const teacherSearchSchema = z.object({
  employmentStatus: z.enum(EMPLOYMENT_STATUSES).optional(),
});
export type TeacherSearchInput = z.infer<typeof teacherSearchSchema>;
