import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex color like #1d4ed8");

/** Accepts a real boolean (JSON body) or "true"/"false" string (multipart form field). */
const booleanish = z.preprocess(
  (v) => (typeof v === "string" ? v === "true" : v),
  z.boolean()
);

export const updateSchoolProfileSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().max(500).optional(),
  website: z.string().max(200).optional(),
  idCardPrimaryColor: hexColor.optional(),
  idCardSecondaryColor: hexColor.optional(),
  idCardQrVerificationEnabled: booleanish.optional(),
});
export type UpdateSchoolProfileInput = z.infer<typeof updateSchoolProfileSchema>;

/**
 * Describes the merged { userId, roleId } shape consumed by the user-management service.
 * userId is optional here because the wire-level source is usually the `:id` route param
 * (POST /users/:id/roles) rather than the request body; the controller merges
 * req.params.id + req.body.roleId and validates the combined object against this schema
 * before calling the service, so the service layer always receives both fields populated.
 */
export const assignRoleSchema = z.object({
  userId: z.string().min(1).optional(),
  roleId: z.string().min(1),
});
export type AssignRoleInput = z.infer<typeof assignRoleSchema> & { userId: string };

export const revokeRoleSchema = z.object({
  userId: z.string().min(1).optional(),
  roleId: z.string().min(1).optional(),
});
export type RevokeRoleInput = z.infer<typeof revokeRoleSchema> & { userId: string; roleId: string };

export const createHolidaySchema = z.object({
  name: z.string().min(1).max(150),
  date: z.coerce.date(),
  recurring: z.boolean().default(false),
});
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
