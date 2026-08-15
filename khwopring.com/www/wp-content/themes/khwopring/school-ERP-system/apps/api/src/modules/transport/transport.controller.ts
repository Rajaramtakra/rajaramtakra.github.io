import type { Request, Response } from "express";
import * as transportService from "./transport.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

// ---------- Vehicles ----------

export const listVehicles = asyncHandler(async (req: Request, res: Response) => {
  const vehicles = await transportService.listVehicles(req.user!.schoolId);
  res.json({ vehicles });
});

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await transportService.createVehicle(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_VEHICLE", resource: "vehicle", resourceId: vehicle.id });
  res.status(201).json({ vehicle });
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await transportService.updateVehicle(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_VEHICLE", resource: "vehicle", resourceId: vehicle.id });
  res.json({ vehicle });
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await transportService.deleteVehicle(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "DELETE_VEHICLE", resource: "vehicle", resourceId: vehicle.id });
  res.status(204).send();
});

// ---------- Drivers ----------

export const listDrivers = asyncHandler(async (req: Request, res: Response) => {
  const drivers = await transportService.listDrivers(req.user!.schoolId);
  res.json({ drivers });
});

export const createDriver = asyncHandler(async (req: Request, res: Response) => {
  const driver = await transportService.createDriver(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_DRIVER", resource: "driver", resourceId: driver.id });
  res.status(201).json({ driver });
});

export const updateDriver = asyncHandler(async (req: Request, res: Response) => {
  const driver = await transportService.updateDriver(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_DRIVER", resource: "driver", resourceId: driver.id });
  res.json({ driver });
});

export const deleteDriver = asyncHandler(async (req: Request, res: Response) => {
  const driver = await transportService.deleteDriver(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "DELETE_DRIVER", resource: "driver", resourceId: driver.id });
  res.status(204).send();
});

// ---------- Routes ----------

export const listRoutes = asyncHandler(async (req: Request, res: Response) => {
  const routes = await transportService.listRoutes(req.user!.schoolId);
  res.json({ routes });
});

export const getRoute = asyncHandler(async (req: Request, res: Response) => {
  const route = await transportService.getRoute(req.user!.schoolId, req.params.id);
  res.json({ route });
});

export const createRoute = asyncHandler(async (req: Request, res: Response) => {
  const route = await transportService.createRoute(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_ROUTE", resource: "route", resourceId: route.id });
  res.status(201).json({ route });
});

export const updateRoute = asyncHandler(async (req: Request, res: Response) => {
  const route = await transportService.updateRoute(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_ROUTE", resource: "route", resourceId: route.id });
  res.json({ route });
});

export const deleteRoute = asyncHandler(async (req: Request, res: Response) => {
  const route = await transportService.deleteRoute(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "DELETE_ROUTE", resource: "route", resourceId: route.id });
  res.status(204).send();
});

// ---------- Pickup points ----------

export const createPickupPoint = asyncHandler(async (req: Request, res: Response) => {
  const pickupPoint = await transportService.createPickupPoint(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_PICKUP_POINT", resource: "pickupPoint", resourceId: pickupPoint.id });
  res.status(201).json({ pickupPoint });
});

export const updatePickupPoint = asyncHandler(async (req: Request, res: Response) => {
  const pickupPoint = await transportService.updatePickupPoint(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_PICKUP_POINT", resource: "pickupPoint", resourceId: pickupPoint.id });
  res.json({ pickupPoint });
});

export const deletePickupPoint = asyncHandler(async (req: Request, res: Response) => {
  const pickupPoint = await transportService.deletePickupPoint(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "DELETE_PICKUP_POINT", resource: "pickupPoint", resourceId: pickupPoint.id });
  res.status(204).send();
});

// ---------- Transport fees ----------

export const getTransportFee = asyncHandler(async (req: Request, res: Response) => {
  const { routeId, academicSessionId } = req.query as Record<string, string | undefined>;
  const transportFee = await transportService.getTransportFee(req.user!.schoolId, routeId, academicSessionId);
  res.json({ transportFee });
});

export const createTransportFee = asyncHandler(async (req: Request, res: Response) => {
  const transportFee = await transportService.createTransportFee(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_TRANSPORT_FEE", resource: "transportFee", resourceId: transportFee.id });
  res.status(201).json({ transportFee });
});

// ---------- Route assignments ----------

export const listAssignments = asyncHandler(async (req: Request, res: Response) => {
  const { routeId, studentId } = req.query as Record<string, string | undefined>;
  const assignments = await transportService.listAssignmentsForCaller(
    req.user!.schoolId,
    { userId: req.user!.id, permissions: req.user!.permissions },
    { routeId, studentId }
  );
  res.json({ assignments });
});

export const assignStudent = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await transportService.assignStudentToRoute(req.user!.schoolId, req.body);
  await recordAudit({
    req,
    action: "ASSIGN_ROUTE",
    resource: "routeAssignment",
    resourceId: assignment.id,
    metadata: { studentId: assignment.studentId, routeId: assignment.routeId },
  });
  res.status(201).json({ assignment });
});

export const removeAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await transportService.removeAssignment(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "REMOVE_ROUTE_ASSIGNMENT", resource: "routeAssignment", resourceId: assignment.id });
  res.status(204).send();
});

export const bulkAssignStudents = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await transportService.bulkAssignStudentsToRoute(req.user!.schoolId, req.params.routeId, req.body);
  await recordAudit({
    req,
    action: "BULK_ASSIGN_ROUTE",
    resource: "routeAssignment",
    metadata: { routeId: req.params.routeId, count: assignments.length },
  });
  res.status(201).json({ assignments });
});

// ---------- Fuel logs ----------

export const createFuelLog = asyncHandler(async (req: Request, res: Response) => {
  const fuelLog = await transportService.createFuelLog(req.user!.schoolId, req.user!.id, req.params.id, req.body);
  await recordAudit({ req, action: "CREATE_FUEL_LOG", resource: "fuelLog", resourceId: fuelLog.id });
  res.status(201).json({ fuelLog });
});

export const listFuelLogs = asyncHandler(async (req: Request, res: Response) => {
  const fuelLogs = await transportService.listFuelLogs(req.user!.schoolId, req.params.id);
  res.json({ fuelLogs });
});
