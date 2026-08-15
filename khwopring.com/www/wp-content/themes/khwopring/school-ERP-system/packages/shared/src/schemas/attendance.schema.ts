import { z } from "zod";
import { ATTENDANCE_STATUSES } from "../enums";

export const markStudentAttendanceSchema = z.object({
  sectionId: z.string().min(1),
  date: z.coerce.date(),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(ATTENDANCE_STATUSES),
        remarks: z.string().max(300).optional(),
      })
    )
    .min(1),
});
export type MarkStudentAttendanceInput = z.infer<typeof markStudentAttendanceSchema>;

export const studentAttendanceQuerySchema = z.object({
  sectionId: z.string().optional(),
  studentId: z.string().optional(),
  date: z.coerce.date().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});
export type StudentAttendanceQuery = z.infer<typeof studentAttendanceQuerySchema>;

export const markStaffAttendanceSchema = z
  .object({
    teacherId: z.string().min(1).optional(),
    staffId: z.string().min(1).optional(),
    date: z.coerce.date(),
    status: z.enum(ATTENDANCE_STATUSES),
    checkInAt: z.coerce.date().optional(),
    checkOutAt: z.coerce.date().optional(),
  })
  .refine((v) => Boolean(v.teacherId) !== Boolean(v.staffId), {
    message: "Provide exactly one of teacherId or staffId",
  });
export type MarkStaffAttendanceInput = z.infer<typeof markStaffAttendanceSchema>;

export const staffAttendanceQuerySchema = z.object({
  teacherId: z.string().optional(),
  staffId: z.string().optional(),
  date: z.coerce.date().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});
export type StaffAttendanceQuery = z.infer<typeof staffAttendanceQuerySchema>;
