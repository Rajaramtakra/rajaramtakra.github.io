import { Router } from "express";
import {
  assignStudentToRouteSchema,
  bulkAssignStudentsToRouteSchema,
  createDriverSchema,
  createFuelLogSchema,
  createPickupPointSchema,
  createRouteSchema,
  createTransportFeeSchema,
  createVehicleSchema,
  updateDriverSchema,
  updatePickupPointSchema,
  updateRouteSchema,
  updateVehicleSchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./transport.controller";

export const transportRouter = Router();
transportRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Transport
 *   description: Vehicles, drivers, routes, pickup points, transport fees, and student route assignments
 */

// Vehicles
transportRouter.get("/vehicles", requirePermission("transport:manage", "transport:read"), controller.listVehicles);
transportRouter.post(
  "/vehicles",
  requirePermission("transport:manage"),
  validateBody(createVehicleSchema),
  controller.createVehicle
);
transportRouter.patch(
  "/vehicles/:id",
  requirePermission("transport:manage"),
  validateBody(updateVehicleSchema),
  controller.updateVehicle
);
transportRouter.delete("/vehicles/:id", requirePermission("transport:manage"), controller.deleteVehicle);

// Drivers
transportRouter.get("/drivers", requirePermission("transport:manage", "transport:read"), controller.listDrivers);
transportRouter.post(
  "/drivers",
  requirePermission("transport:manage"),
  validateBody(createDriverSchema),
  controller.createDriver
);
transportRouter.patch(
  "/drivers/:id",
  requirePermission("transport:manage"),
  validateBody(updateDriverSchema),
  controller.updateDriver
);
transportRouter.delete("/drivers/:id", requirePermission("transport:manage"), controller.deleteDriver);

// Routes
transportRouter.get("/routes", requirePermission("transport:manage", "transport:read"), controller.listRoutes);
transportRouter.get("/routes/:id", requirePermission("transport:manage", "transport:read"), controller.getRoute);
transportRouter.post(
  "/routes",
  requirePermission("transport:manage"),
  validateBody(createRouteSchema),
  controller.createRoute
);
transportRouter.patch(
  "/routes/:id",
  requirePermission("transport:manage"),
  validateBody(updateRouteSchema),
  controller.updateRoute
);
transportRouter.delete("/routes/:id", requirePermission("transport:manage"), controller.deleteRoute);

// Pickup points
transportRouter.post(
  "/pickup-points",
  requirePermission("transport:manage"),
  validateBody(createPickupPointSchema),
  controller.createPickupPoint
);
transportRouter.patch(
  "/pickup-points/:id",
  requirePermission("transport:manage"),
  validateBody(updatePickupPointSchema),
  controller.updatePickupPoint
);
transportRouter.delete("/pickup-points/:id", requirePermission("transport:manage"), controller.deletePickupPoint);

// Transport fees (read-only lookup surfaced alongside a route/assignment; does not touch invoicing)
transportRouter.get(
  "/fees",
  requirePermission("transport:manage", "transport:read", "transport:read_own"),
  controller.getTransportFee
);
transportRouter.post(
  "/fees",
  requirePermission("transport:manage"),
  validateBody(createTransportFeeSchema),
  controller.createTransportFee
);

// Route assignments
transportRouter.get(
  "/assignments",
  requirePermission("transport:manage", "transport:read", "transport:read_own"),
  controller.listAssignments
);
transportRouter.post(
  "/assignments",
  requirePermission("transport:manage"),
  validateBody(assignStudentToRouteSchema),
  controller.assignStudent
);
transportRouter.delete("/assignments/:id", requirePermission("transport:manage"), controller.removeAssignment);
transportRouter.post(
  "/routes/:routeId/assignments/bulk",
  requirePermission("transport:manage"),
  validateBody(bulkAssignStudentsToRouteSchema),
  controller.bulkAssignStudents
);

// Fuel logs
transportRouter.get(
  "/vehicles/:id/fuel-logs",
  requirePermission("transport:manage", "transport:read"),
  controller.listFuelLogs
);
transportRouter.post(
  "/vehicles/:id/fuel-logs",
  requirePermission("transport:manage"),
  validateBody(createFuelLogSchema),
  controller.createFuelLog
);
