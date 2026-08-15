import { z } from "zod";

/** Mirrors the Prisma VehicleType enum (schema.prisma). Kept local to this schema file per module convention. */
export const VEHICLE_TYPES = ["BUS", "VAN", "CAR", "OTHER"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(2).max(30),
  type: z.enum(VEHICLE_TYPES),
  capacity: z.coerce.number().int().min(1).max(200),
  driverId: z.string().min(1).optional(),
});
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = createVehicleSchema.partial();
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

export const createDriverSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(20),
  licenseNumber: z.string().min(2).max(50),
});
export type CreateDriverInput = z.infer<typeof createDriverSchema>;

export const updateDriverSchema = createDriverSchema.partial();
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

export const createRouteSchema = z.object({
  name: z.string().min(1).max(120),
  vehicleId: z.string().min(1).optional(),
});
export type CreateRouteInput = z.infer<typeof createRouteSchema>;

export const updateRouteSchema = createRouteSchema.partial();
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;

export const createPickupPointSchema = z.object({
  routeId: z.string().min(1),
  name: z.string().min(1).max(120),
  order: z.coerce.number().int().min(0).default(0),
  pickupTime: z.string().max(20).optional(),
});
export type CreatePickupPointInput = z.infer<typeof createPickupPointSchema>;

export const updatePickupPointSchema = createPickupPointSchema.partial().omit({ routeId: true });
export type UpdatePickupPointInput = z.infer<typeof updatePickupPointSchema>;

export const createTransportFeeSchema = z.object({
  routeId: z.string().min(1),
  academicSessionId: z.string().min(1),
  amount: z.coerce.number().positive(),
});
export type CreateTransportFeeInput = z.infer<typeof createTransportFeeSchema>;

export const assignStudentToRouteSchema = z.object({
  routeId: z.string().min(1),
  studentId: z.string().min(1),
  pickupPointId: z.string().min(1).optional(),
});
export type AssignStudentToRouteInput = z.infer<typeof assignStudentToRouteSchema>;

export const bulkAssignStudentsToRouteSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1),
  pickupPointId: z.string().min(1).optional(),
});
export type BulkAssignStudentsToRouteInput = z.infer<typeof bulkAssignStudentsToRouteSchema>;

export const createFuelLogSchema = z.object({
  filledAt: z.coerce.date().optional(),
  litres: z.coerce.number().positive(),
  costPerLitre: z.coerce.number().positive(),
  odometerReading: z.coerce.number().int().nonnegative().optional(),
});
export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
