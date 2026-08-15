import type {
  AssignStudentToRouteInput,
  BulkAssignStudentsToRouteInput,
  CreateDriverInput,
  CreateFuelLogInput,
  CreatePickupPointInput,
  CreateRouteInput,
  CreateTransportFeeInput,
  CreateVehicleInput,
  Permission,
  UpdateDriverInput,
  UpdatePickupPointInput,
  UpdateRouteInput,
  UpdateVehicleInput,
} from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { getOwnStudentId } from "../../lib/students";

// =========================================================================
// Vehicles
// =========================================================================

export function listVehicles(schoolId: string) {
  return prisma.vehicle.findMany({
    where: { schoolId, deletedAt: null },
    include: { driver: true },
    orderBy: { createdAt: "desc" },
  });
}

async function findVehicleOrThrow(schoolId: string, id: string) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!vehicle) throw new NotFoundError("Vehicle not found");
  return vehicle;
}

async function assertDriverExists(schoolId: string, driverId: string) {
  const driver = await prisma.driver.findFirst({ where: { id: driverId, schoolId, deletedAt: null } });
  if (!driver) throw new NotFoundError("Driver not found");
}

export async function createVehicle(schoolId: string, input: CreateVehicleInput) {
  if (input.driverId) await assertDriverExists(schoolId, input.driverId);
  return prisma.vehicle.create({ data: { schoolId, ...input }, include: { driver: true } });
}

export async function updateVehicle(schoolId: string, id: string, input: UpdateVehicleInput) {
  await findVehicleOrThrow(schoolId, id);
  if (input.driverId) await assertDriverExists(schoolId, input.driverId);
  return prisma.vehicle.update({ where: { id }, data: input, include: { driver: true } });
}

export async function deleteVehicle(schoolId: string, id: string) {
  await findVehicleOrThrow(schoolId, id);
  return prisma.vehicle.update({ where: { id }, data: { deletedAt: new Date() } });
}

// =========================================================================
// Drivers
// =========================================================================

export function listDrivers(schoolId: string) {
  return prisma.driver.findMany({ where: { schoolId, deletedAt: null }, orderBy: { createdAt: "desc" } });
}

async function findDriverOrThrow(schoolId: string, id: string) {
  const driver = await prisma.driver.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!driver) throw new NotFoundError("Driver not found");
  return driver;
}

export async function createDriver(schoolId: string, input: CreateDriverInput) {
  return prisma.driver.create({ data: { schoolId, ...input } });
}

export async function updateDriver(schoolId: string, id: string, input: UpdateDriverInput) {
  await findDriverOrThrow(schoolId, id);
  return prisma.driver.update({ where: { id }, data: input });
}

export async function deleteDriver(schoolId: string, id: string) {
  await findDriverOrThrow(schoolId, id);
  return prisma.driver.update({ where: { id }, data: { deletedAt: new Date() } });
}

// =========================================================================
// Routes
// =========================================================================

const ROUTE_INCLUDE = {
  vehicle: { include: { driver: true } },
  pickupPoints: { orderBy: { order: "asc" as const } },
  _count: { select: { assignments: true } },
} as const;

export function listRoutes(schoolId: string) {
  return prisma.route.findMany({
    where: { schoolId, deletedAt: null },
    include: ROUTE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

async function findRouteOrThrow(schoolId: string, id: string) {
  const route = await prisma.route.findFirst({ where: { id, schoolId, deletedAt: null }, include: ROUTE_INCLUDE });
  if (!route) throw new NotFoundError("Route not found");
  return route;
}

export function getRoute(schoolId: string, id: string) {
  return findRouteOrThrow(schoolId, id);
}

async function assertVehicleExists(schoolId: string, vehicleId: string) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, schoolId, deletedAt: null } });
  if (!vehicle) throw new NotFoundError("Vehicle not found");
}

export async function createRoute(schoolId: string, input: CreateRouteInput) {
  if (input.vehicleId) await assertVehicleExists(schoolId, input.vehicleId);
  const route = await prisma.route.create({ data: { schoolId, ...input } });
  return findRouteOrThrow(schoolId, route.id);
}

export async function updateRoute(schoolId: string, id: string, input: UpdateRouteInput) {
  await findRouteOrThrow(schoolId, id);
  if (input.vehicleId) await assertVehicleExists(schoolId, input.vehicleId);
  await prisma.route.update({ where: { id }, data: input });
  return findRouteOrThrow(schoolId, id);
}

export async function deleteRoute(schoolId: string, id: string) {
  await findRouteOrThrow(schoolId, id);
  return prisma.route.update({ where: { id }, data: { deletedAt: new Date() } });
}

// =========================================================================
// Pickup points
// =========================================================================

export async function createPickupPoint(schoolId: string, input: CreatePickupPointInput) {
  await findRouteOrThrow(schoolId, input.routeId);
  return prisma.pickupPoint.create({ data: input });
}

async function findPickupPointOrThrow(schoolId: string, id: string) {
  const point = await prisma.pickupPoint.findFirst({ where: { id, route: { schoolId, deletedAt: null } } });
  if (!point) throw new NotFoundError("Pickup point not found");
  return point;
}

export async function updatePickupPoint(schoolId: string, id: string, input: UpdatePickupPointInput) {
  await findPickupPointOrThrow(schoolId, id);
  return prisma.pickupPoint.update({ where: { id }, data: input });
}

export async function deletePickupPoint(schoolId: string, id: string) {
  await findPickupPointOrThrow(schoolId, id);
  return prisma.pickupPoint.delete({ where: { id } });
}

// =========================================================================
// Transport fees
// (Simple per-route-per-session read-only lookup. NOTE: creating/looking up a fee does NOT
// generate an invoice line item for the student — wiring transport fees into the invoicing
// module is a follow-on integration point, out of scope here.)
// =========================================================================

export async function createTransportFee(schoolId: string, input: CreateTransportFeeInput) {
  await findRouteOrThrow(schoolId, input.routeId);
  return prisma.transportFee.create({ data: { schoolId, ...input } });
}

export function getTransportFee(schoolId: string, routeId?: string, academicSessionId?: string) {
  return prisma.transportFee.findFirst({
    where: {
      schoolId,
      ...(routeId ? { routeId } : {}),
      ...(academicSessionId ? { academicSessionId } : {}),
    },
  });
}

// =========================================================================
// Route assignments
// =========================================================================

const ASSIGNMENT_INCLUDE = {
  student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
  route: { include: { vehicle: true } },
  pickupPoint: true,
} as const;

export async function listAssignmentsForCaller(
  schoolId: string,
  requester: { userId: string; permissions: Permission[] },
  filters: { routeId?: string; studentId?: string }
) {
  const canReadAll =
    requester.permissions.includes("transport:manage") || requester.permissions.includes("transport:read");
  const studentId = canReadAll ? filters.studentId : await getOwnStudentId(schoolId, requester.userId);

  return prisma.routeAssignment.findMany({
    where: {
      route: { schoolId },
      ...(filters.routeId ? { routeId: filters.routeId } : {}),
      ...(studentId ? { studentId } : {}),
    },
    include: ASSIGNMENT_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Assigns a student to a route + optional pickup point.
 *
 * Business rules:
 *  - A student may only have ONE active transport assignment across all routes at a time.
 *    Reassigning a student replaces (deletes) their prior assignment — this is intentional,
 *    not an error case.
 *  - Capacity is enforced against the route's vehicle: if the student is moving to a
 *    different route (or has no existing assignment), the target route's current
 *    assignment count must be below the vehicle's capacity, or a ConflictError is thrown.
 *    Re-assigning within the SAME route (e.g. just changing pickup point) never trips the
 *    capacity check since it does not add a net-new occupant.
 */
export async function assignStudentToRoute(schoolId: string, input: AssignStudentToRouteInput) {
  const route = await prisma.route.findFirst({
    where: { id: input.routeId, schoolId, deletedAt: null },
    include: { vehicle: true },
  });
  if (!route) throw new NotFoundError("Route not found");

  const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId, deletedAt: null } });
  if (!student) throw new NotFoundError("Student not found");

  if (input.pickupPointId) {
    const point = await prisma.pickupPoint.findFirst({ where: { id: input.pickupPointId, routeId: input.routeId } });
    if (!point) throw new NotFoundError("Pickup point not found on this route");
  }

  const existing = await prisma.routeAssignment.findFirst({ where: { studentId: input.studentId } });
  const isMovingToNewRoute = !existing || existing.routeId !== input.routeId;

  if (isMovingToNewRoute && route.vehicle) {
    const seatCount = await prisma.routeAssignment.count({ where: { routeId: input.routeId } });
    if (seatCount >= route.vehicle.capacity) {
      throw new ConflictError("This route's vehicle is already at full capacity");
    }
  }

  return prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.routeAssignment.delete({ where: { id: existing.id } });
    }
    return tx.routeAssignment.create({
      data: {
        routeId: input.routeId,
        studentId: input.studentId,
        pickupPointId: input.pickupPointId,
        sectionId: student.sectionId,
      },
      include: ASSIGNMENT_INCLUDE,
    });
  });
}

export async function removeAssignment(schoolId: string, id: string) {
  const assignment = await prisma.routeAssignment.findFirst({ where: { id, route: { schoolId } } });
  if (!assignment) throw new NotFoundError("Assignment not found");
  await prisma.routeAssignment.delete({ where: { id } });
  return assignment;
}

/**
 * Assigns each student sequentially (not inside one outer transaction) so the capacity check in
 * `assignStudentToRoute` re-reads committed state before every seat is taken — this naturally
 * rejects once the vehicle fills up mid-batch instead of requiring a separate pre-flight count.
 */
export async function bulkAssignStudentsToRoute(
  schoolId: string,
  routeId: string,
  input: BulkAssignStudentsToRouteInput
) {
  const assignments = [];
  for (const studentId of input.studentIds) {
    assignments.push(
      await assignStudentToRoute(schoolId, { routeId, studentId, pickupPointId: input.pickupPointId })
    );
  }
  return assignments;
}

// =========================================================================
// Fuel logs
// =========================================================================

export async function createFuelLog(
  schoolId: string,
  filledById: string,
  vehicleId: string,
  input: CreateFuelLogInput
) {
  await findVehicleOrThrow(schoolId, vehicleId);
  const totalCost = Math.round(input.litres * input.costPerLitre * 100) / 100;

  return prisma.fuelLog.create({
    data: {
      schoolId,
      vehicleId,
      filledById,
      filledAt: input.filledAt ?? new Date(),
      litres: input.litres,
      costPerLitre: input.costPerLitre,
      totalCost,
      odometerReading: input.odometerReading,
    },
  });
}

export async function listFuelLogs(schoolId: string, vehicleId: string) {
  await findVehicleOrThrow(schoolId, vehicleId);
  return prisma.fuelLog.findMany({ where: { schoolId, vehicleId }, orderBy: { filledAt: "desc" } });
}
