import { z } from "zod";

export const createHostelSchema = z.object({
  name: z.string().min(1).max(150),
  address: z.string().max(300).optional(),
  wardenStaffId: z.string().min(1).optional(),
  totalCapacity: z.coerce.number().int().positive(),
});
export type CreateHostelInput = z.infer<typeof createHostelSchema>;

export const updateHostelSchema = createHostelSchema.partial();
export type UpdateHostelInput = z.infer<typeof updateHostelSchema>;

export const createHostelRoomSchema = z.object({
  hostelId: z.string().min(1),
  roomNumber: z.string().min(1).max(30),
  capacity: z.coerce.number().int().positive(),
  roomType: z.string().max(60).optional(),
});
export type CreateHostelRoomInput = z.infer<typeof createHostelRoomSchema>;

export const updateHostelRoomSchema = createHostelRoomSchema.partial().omit({ hostelId: true });
export type UpdateHostelRoomInput = z.infer<typeof updateHostelRoomSchema>;

export const createHostelAllocationSchema = z.object({
  hostelRoomId: z.string().min(1),
  studentId: z.string().min(1),
  checkInDate: z.coerce.date().optional(),
});
export type CreateHostelAllocationInput = z.infer<typeof createHostelAllocationSchema>;

export const checkoutHostelAllocationSchema = z.object({
  checkOutDate: z.coerce.date().optional(),
});
export type CheckoutHostelAllocationInput = z.infer<typeof checkoutHostelAllocationSchema>;
