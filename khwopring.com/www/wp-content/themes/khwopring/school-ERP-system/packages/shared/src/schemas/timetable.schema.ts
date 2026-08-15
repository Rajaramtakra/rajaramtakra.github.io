import { z } from "zod";
import { DAYS_OF_WEEK } from "../enums";

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm 24-hour format");

export const createTimetableEntrySchema = z
  .object({
    sectionId: z.string().min(1),
    subjectId: z.string().min(1),
    teacherId: z.string().min(1),
    dayOfWeek: z.enum(DAYS_OF_WEEK),
    periodId: z.string().min(1).optional(),
    startTime: timeString.optional(),
    endTime: timeString.optional(),
    room: z.string().max(60).optional(),
  })
  .refine((v) => Boolean(v.periodId) || (Boolean(v.startTime) && Boolean(v.endTime)), {
    message: "Provide either a periodId or both startTime and endTime",
  });
export type CreateTimetableEntryInput = z.infer<typeof createTimetableEntrySchema>;

export const updateTimetableEntrySchema = z.object({
  subjectId: z.string().min(1).optional(),
  teacherId: z.string().min(1).optional(),
  dayOfWeek: z.enum(DAYS_OF_WEEK).optional(),
  periodId: z.string().min(1).optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  room: z.string().max(60).optional(),
});
export type UpdateTimetableEntryInput = z.infer<typeof updateTimetableEntrySchema>;

export const createPeriodSchema = z.object({
  name: z.string().min(1).max(60),
  order: z.coerce.number().int().min(0),
  startTime: timeString,
  endTime: timeString,
  isBreak: z.boolean().default(false),
});
export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;

export const updatePeriodSchema = createPeriodSchema.partial();
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>;
