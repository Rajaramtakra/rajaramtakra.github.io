import type {
  CreateHostelAllocationInput,
  CreateHostelInput,
  CreateHostelRoomInput,
  UpdateHostelInput,
  UpdateHostelRoomInput,
} from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors";

const HOSTEL_INCLUDE = {
  wardenStaff: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
  rooms: true,
} as const;

/** Merges each room's ACTIVE-allocation occupancy in via a single groupBy, since Prisma's filtered
 * relation-count feature isn't relied on elsewhere in this codebase. */
async function attachOccupancy<T extends { id: string }>(rooms: T[]): Promise<(T & { occupied: number })[]> {
  if (rooms.length === 0) return [];
  const counts = await prisma.hostelAllocation.groupBy({
    by: ["hostelRoomId"],
    where: { hostelRoomId: { in: rooms.map((r) => r.id) }, status: "ACTIVE" },
    _count: { _all: true },
  });
  const occupiedByRoom = new Map(counts.map((c) => [c.hostelRoomId, c._count._all]));
  return rooms.map((room) => ({ ...room, occupied: occupiedByRoom.get(room.id) ?? 0 }));
}

// =========================================================================
// Hostels
// =========================================================================

export async function listHostels(schoolId: string) {
  const hostels = await prisma.hostel.findMany({
    where: { schoolId, deletedAt: null },
    include: HOSTEL_INCLUDE,
    orderBy: { name: "asc" },
  });
  return Promise.all(
    hostels.map(async (hostel) => ({ ...hostel, rooms: await attachOccupancy(hostel.rooms) }))
  );
}

async function findHostelOrThrow(schoolId: string, id: string) {
  const hostel = await prisma.hostel.findFirst({ where: { id, schoolId, deletedAt: null }, include: HOSTEL_INCLUDE });
  if (!hostel) throw new NotFoundError("Hostel not found");
  return hostel;
}

export async function getHostel(schoolId: string, id: string) {
  const hostel = await findHostelOrThrow(schoolId, id);
  return { ...hostel, rooms: await attachOccupancy(hostel.rooms) };
}

async function assertStaffExists(schoolId: string, staffId: string) {
  const staff = await prisma.staffMember.findFirst({ where: { id: staffId, schoolId, deletedAt: null } });
  if (!staff) throw new NotFoundError("Staff member not found");
}

export async function createHostel(schoolId: string, input: CreateHostelInput) {
  if (input.wardenStaffId) await assertStaffExists(schoolId, input.wardenStaffId);
  const existing = await prisma.hostel.findFirst({ where: { schoolId, name: input.name, deletedAt: null } });
  if (existing) throw new ConflictError(`A hostel named "${input.name}" already exists`);

  const hostel = await prisma.hostel.create({ data: { schoolId, ...input }, include: HOSTEL_INCLUDE });
  return { ...hostel, rooms: await attachOccupancy(hostel.rooms) };
}

export async function updateHostel(schoolId: string, id: string, input: UpdateHostelInput) {
  await findHostelOrThrow(schoolId, id);
  if (input.wardenStaffId) await assertStaffExists(schoolId, input.wardenStaffId);
  const hostel = await prisma.hostel.update({ where: { id }, data: input, include: HOSTEL_INCLUDE });
  return { ...hostel, rooms: await attachOccupancy(hostel.rooms) };
}

// =========================================================================
// Hostel rooms
// =========================================================================

async function findRoomOrThrow(schoolId: string, id: string) {
  const room = await prisma.hostelRoom.findFirst({ where: { id, hostel: { schoolId, deletedAt: null } } });
  if (!room) throw new NotFoundError("Hostel room not found");
  return room;
}

export async function listRoomsForHostel(schoolId: string, hostelId: string) {
  const rooms = await prisma.hostelRoom.findMany({
    where: { hostelId, hostel: { schoolId, deletedAt: null } },
    orderBy: { roomNumber: "asc" },
  });
  return attachOccupancy(rooms);
}

export async function createHostelRoom(schoolId: string, input: CreateHostelRoomInput) {
  await findHostelOrThrow(schoolId, input.hostelId);
  const existing = await prisma.hostelRoom.findFirst({ where: { hostelId: input.hostelId, roomNumber: input.roomNumber } });
  if (existing) throw new ConflictError(`Room "${input.roomNumber}" already exists in this hostel`);
  return prisma.hostelRoom.create({ data: input });
}

export async function updateHostelRoom(schoolId: string, id: string, input: UpdateHostelRoomInput) {
  await findRoomOrThrow(schoolId, id);
  return prisma.hostelRoom.update({ where: { id }, data: input });
}

// =========================================================================
// Allocations
// =========================================================================

const ALLOCATION_INCLUDE = {
  student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
  hostelRoom: { include: { hostel: true } },
} as const;

/**
 * Allocates a student to a room. Capacity-checked against the room's active occupant count, and
 * refuses to double-allocate a student who already has an ACTIVE allocation elsewhere — enforced
 * in application code (no partial-unique DB index) since Prisma's schema DSL can't express
 * "unique while status = ACTIVE" directly.
 */
export async function createAllocation(schoolId: string, input: CreateHostelAllocationInput) {
  const room = await prisma.hostelRoom.findFirst({
    where: { id: input.hostelRoomId, hostel: { schoolId, deletedAt: null } },
  });
  if (!room) throw new NotFoundError("Hostel room not found");

  const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId, deletedAt: null } });
  if (!student) throw new BadRequestError("Student not found in this school");

  const existingActive = await prisma.hostelAllocation.findFirst({
    where: { studentId: input.studentId, status: "ACTIVE" },
  });
  if (existingActive) {
    throw new ConflictError("This student already has an active hostel allocation. Check them out first.");
  }

  const occupied = await prisma.hostelAllocation.count({ where: { hostelRoomId: room.id, status: "ACTIVE" } });
  if (occupied >= room.capacity) {
    throw new ConflictError(`Room ${room.roomNumber} is already at full capacity (${room.capacity})`);
  }

  return prisma.hostelAllocation.create({
    data: {
      schoolId,
      hostelRoomId: input.hostelRoomId,
      studentId: input.studentId,
      checkInDate: input.checkInDate ?? new Date(),
      status: "ACTIVE",
    },
    include: ALLOCATION_INCLUDE,
  });
}

export async function checkoutAllocation(schoolId: string, id: string, checkOutDate?: Date) {
  const allocation = await prisma.hostelAllocation.findFirst({ where: { id, schoolId } });
  if (!allocation) throw new NotFoundError("Hostel allocation not found");
  if (allocation.status === "CHECKED_OUT") throw new ConflictError("This allocation is already checked out");

  return prisma.hostelAllocation.update({
    where: { id },
    data: { status: "CHECKED_OUT", checkOutDate: checkOutDate ?? new Date() },
    include: ALLOCATION_INCLUDE,
  });
}

export function listAllocations(schoolId: string, filters: { hostelRoomId?: string; status?: string }) {
  return prisma.hostelAllocation.findMany({
    where: {
      schoolId,
      ...(filters.hostelRoomId ? { hostelRoomId: filters.hostelRoomId } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
    },
    include: ALLOCATION_INCLUDE,
    orderBy: { checkInDate: "desc" },
  });
}

export async function getActiveAllocationForStudent(schoolId: string, studentId: string) {
  return prisma.hostelAllocation.findFirst({
    where: { schoolId, studentId, status: "ACTIVE" },
    include: ALLOCATION_INCLUDE,
  });
}
