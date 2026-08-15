import { z } from "zod";

export const updateStudentProfileSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  bloodGroup: z.string().max(5).optional(),
  address: z.string().min(5).max(300).optional(),
  medicalNotes: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
});
export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

export const emergencyContactSchema = z.object({
  fullName: z.string().min(1).max(120),
  relation: z.string().min(1).max(60),
  phone: z.string().min(7).max(20),
});
export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;

export const addGuardianSchema = z.object({
  fullName: z.string().min(2).max(120),
  relation: z.enum(["FATHER", "MOTHER", "GUARDIAN", "GRANDFATHER", "GRANDMOTHER", "OTHER"]),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional(),
  occupation: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
  linkToExistingGuardianId: z.string().min(1).optional(),
});
export type AddGuardianInput = z.infer<typeof addGuardianSchema>;

export const promoteStudentsSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1),
  toSectionId: z.string().min(1),
  toAcademicSessionId: z.string().min(1),
});
export type PromoteStudentsInput = z.infer<typeof promoteStudentsSchema>;

export const suspendStudentSchema = z.object({
  reason: z.string().min(3).max(1000),
  suspendedUntil: z.coerce.date().optional(),
});
export type SuspendStudentInput = z.infer<typeof suspendStudentSchema>;

export const rusticateStudentSchema = z.object({
  reason: z.string().min(3).max(1000),
  rusticatedUntil: z.coerce.date().optional(),
});
export type RusticateStudentInput = z.infer<typeof rusticateStudentSchema>;

export const reinstateStudentSchema = z.object({
  notes: z.string().max(1000).optional(),
});
export type ReinstateStudentInput = z.infer<typeof reinstateStudentSchema>;

export const transferCertificateSchema = z.object({
  reason: z.string().min(3).max(1000),
  issueDate: z.coerce.date().optional(),
});
export type TransferCertificateInput = z.infer<typeof transferCertificateSchema>;

export const alumniConvertSchema = z.object({
  graduationYear: z.coerce.number().int().min(1990).max(2100),
  notes: z.string().max(1000).optional(),
});
export type AlumniConvertInput = z.infer<typeof alumniConvertSchema>;

export const studentSearchSchema = z.object({
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "TRANSFERRED", "ALUMNI", "EXPELLED"]).optional(),
});
export type StudentSearchInput = z.infer<typeof studentSearchSchema>;
