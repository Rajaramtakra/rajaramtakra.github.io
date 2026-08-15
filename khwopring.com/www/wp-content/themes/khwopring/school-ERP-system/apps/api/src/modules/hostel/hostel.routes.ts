import { Router } from "express";
import {
  checkoutHostelAllocationSchema,
  createHostelAllocationSchema,
  createHostelRoomSchema,
  createHostelSchema,
  updateHostelRoomSchema,
  updateHostelSchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./hostel.controller";

export const hostelRouter = Router();
hostelRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Hostel
 *   description: Hostels, rooms, and student room allocations. Hostel fees flow through the existing Fees/Invoice pipeline.
 */

hostelRouter.get("/hostels", requirePermission("hostel:manage", "hostel:read"), controller.listHostels);
hostelRouter.post("/hostels", requirePermission("hostel:manage"), validateBody(createHostelSchema), controller.createHostel);
hostelRouter.get("/hostels/:id", requirePermission("hostel:manage", "hostel:read"), controller.getHostel);
hostelRouter.patch(
  "/hostels/:id",
  requirePermission("hostel:manage"),
  validateBody(updateHostelSchema),
  controller.updateHostel
);

hostelRouter.get(
  "/hostels/:hostelId/rooms",
  requirePermission("hostel:manage", "hostel:read"),
  controller.listRoomsForHostel
);
hostelRouter.post(
  "/rooms",
  requirePermission("hostel:manage"),
  validateBody(createHostelRoomSchema),
  controller.createHostelRoom
);
hostelRouter.patch(
  "/rooms/:id",
  requirePermission("hostel:manage"),
  validateBody(updateHostelRoomSchema),
  controller.updateHostelRoom
);

hostelRouter.get("/allocations", requirePermission("hostel:manage", "hostel:read"), controller.listAllocations);
hostelRouter.post(
  "/allocations",
  requirePermission("hostel:manage"),
  validateBody(createHostelAllocationSchema),
  controller.createAllocation
);
hostelRouter.post(
  "/allocations/:id/checkout",
  requirePermission("hostel:manage"),
  validateBody(checkoutHostelAllocationSchema),
  controller.checkoutAllocation
);

hostelRouter.get(
  "/students/:id/allocation",
  requirePermission("hostel:manage", "hostel:read", "hostel:read_own"),
  controller.getStudentAllocation
);
