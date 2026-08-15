import { z } from "zod";

/**
 * Kept local to this schema file. Must stay in sync with the Prisma `DevicePlatform` enum.
 */
export const DEVICE_PLATFORMS = ["IOS", "ANDROID", "WEB"] as const;
export type DevicePlatformValue = (typeof DEVICE_PLATFORMS)[number];

export const registerDeviceTokenSchema = z.object({
  platform: z.enum(DEVICE_PLATFORMS),
  token: z.string().min(10).max(500),
});
export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;
