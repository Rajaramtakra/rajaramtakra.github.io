import { z } from "zod";
import { GENDERS } from "../enums";

const guardianInputSchema = z.object({
  fullName: z.string().min(2).max(120),
  relation: z.enum(["FATHER", "MOTHER", "GUARDIAN", "GRANDFATHER", "GRANDMOTHER", "OTHER"]),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional(),
  occupation: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
});
export type GuardianInput = z.infer<typeof guardianInputSchema>;

export const createAdmissionApplicationSchema = z.object({
  studentFirstName: z.string().min(1).max(60),
  studentLastName: z.string().min(1).max(60),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(GENDERS),
  bloodGroup: z.string().max(5).optional(),
  nationality: z.string().max(60).optional(),
  address: z.string().min(5).max(300),
  previousSchool: z.string().max(150).optional(),
  classAppliedForId: z.string().min(1),
  academicSessionId: z.string().min(1),
  isRte: z.boolean().default(false),
  rteCategory: z.string().max(60).optional(),
  guardians: z.array(guardianInputSchema).min(1),
});
export type CreateAdmissionApplicationInput = z.infer<typeof createAdmissionApplicationSchema>;

export const updateAdmissionApplicationSchema = createAdmissionApplicationSchema.partial();
export type UpdateAdmissionApplicationInput = z.infer<typeof updateAdmissionApplicationSchema>;

export const reviewAdmissionSchema = z.object({
  notes: z.string().max(1000).optional(),
});
export type ReviewAdmissionInput = z.infer<typeof reviewAdmissionSchema>;

export const decideAdmissionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().max(1000).optional(),
});
export type DecideAdmissionInput = z.infer<typeof decideAdmissionSchema>;

export const enrollAdmissionSchema = z.object({
  sectionId: z.string().min(1),
});
export type EnrollAdmissionInput = z.infer<typeof enrollAdmissionSchema>;

export const uploadAdmissionDocumentSchema = z.object({
  category: z.enum([
    "BIRTH_CERTIFICATE",
    "PREVIOUS_MARKSHEET",
    "TRANSFER_CERTIFICATE",
    "PHOTO",
    "ID_PROOF",
    "ADDRESS_PROOF",
    "MEDICAL_RECORD",
    "OTHER",
  ]),
});
export type UploadAdmissionDocumentInput = z.infer<typeof uploadAdmissionDocumentSchema>;
