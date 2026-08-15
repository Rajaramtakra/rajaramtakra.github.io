import { z } from "zod";
import { ENQUIRY_STATUSES, STUDENT_REQUEST_STATUSES } from "../enums";
import { createAdmissionApplicationSchema } from "./admission.schema";

export const createEnquirySchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional(),
  interestedClassId: z.string().optional(),
  source: z.string().max(60).optional(),
  followUpDate: z.coerce.date().optional(),
  remarks: z.string().max(1000).optional(),
});
export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;

export const updateEnquirySchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().email().optional(),
  interestedClassId: z.string().optional(),
  source: z.string().max(60).optional(),
  status: z.enum(ENQUIRY_STATUSES).optional(),
  followUpDate: z.coerce.date().optional(),
  remarks: z.string().max(1000).optional(),
});
export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;

export const listEnquiriesQuerySchema = z.object({
  status: z.enum(ENQUIRY_STATUSES).optional(),
});
export type ListEnquiriesQuery = z.infer<typeof listEnquiriesQuerySchema>;

export const convertEnquirySchema = createAdmissionApplicationSchema;
export type ConvertEnquiryInput = z.infer<typeof convertEnquirySchema>;

export const createStudentRequestSchema = z.object({
  studentId: z.string().min(1),
  raisedByGuardianId: z.string().optional(),
  category: z.string().min(2).max(60),
  subject: z.string().min(2).max(150),
  description: z.string().min(2).max(2000),
});
export type CreateStudentRequestInput = z.infer<typeof createStudentRequestSchema>;

export const updateStudentRequestSchema = z.object({
  status: z.enum(STUDENT_REQUEST_STATUSES),
});
export type UpdateStudentRequestInput = z.infer<typeof updateStudentRequestSchema>;

export const listStudentRequestsQuerySchema = z.object({
  status: z.enum(STUDENT_REQUEST_STATUSES).optional(),
  studentId: z.string().optional(),
});
export type ListStudentRequestsQuery = z.infer<typeof listStudentRequestsQuerySchema>;

export const createPtmMeetingSchema = z.object({
  sectionId: z.string().optional(),
  title: z.string().min(2).max(150),
  scheduledAt: z.coerce.date(),
  venue: z.string().max(150).optional(),
  notes: z.string().max(1000).optional(),
  studentIds: z.array(z.string()).min(1),
});
export type CreatePtmMeetingInput = z.infer<typeof createPtmMeetingSchema>;

export const recordPtmAttendanceSchema = z.object({
  attendances: z
    .array(
      z.object({
        studentId: z.string().min(1),
        guardianId: z.string().optional(),
        attended: z.boolean(),
        remarks: z.string().max(500).optional(),
      })
    )
    .min(1),
});
export type RecordPtmAttendanceInput = z.infer<typeof recordPtmAttendanceSchema>;
