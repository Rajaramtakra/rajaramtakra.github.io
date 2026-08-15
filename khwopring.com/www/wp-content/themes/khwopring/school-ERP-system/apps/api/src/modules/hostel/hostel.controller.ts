import type { Request, Response } from "express";
import * as hostelService from "./hostel.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";
import { getOwnStudentId } from "../../lib/students";

export const listHostels = asyncHandler(async (req: Request, res: Response) => {
  const hostels = await hostelService.listHostels(req.user!.schoolId);
  res.json({ hostels });
});

export const getHostel = asyncHandler(async (req: Request, res: Response) => {
  const hostel = await hostelService.getHostel(req.user!.schoolId, req.params.id);
  res.json({ hostel });
});

export const createHostel = asyncHandler(async (req: Request, res: Response) => {
  const hostel = await hostelService.createHostel(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_HOSTEL", resource: "hostel", resourceId: hostel.id });
  res.status(201).json({ hostel });
});

export const updateHostel = asyncHandler(async (req: Request, res: Response) => {
  const hostel = await hostelService.updateHostel(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_HOSTEL", resource: "hostel", resourceId: hostel.id });
  res.json({ hostel });
});

export const listRoomsForHostel = asyncHandler(async (req: Request, res: Response) => {
  const rooms = await hostelService.listRoomsForHostel(req.user!.schoolId, req.params.hostelId);
  res.json({ rooms });
});

export const createHostelRoom = asyncHandler(async (req: Request, res: Response) => {
  const room = await hostelService.createHostelRoom(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_HOSTEL_ROOM", resource: "hostel_room", resourceId: room.id });
  res.status(201).json({ room });
});

export const updateHostelRoom = asyncHandler(async (req: Request, res: Response) => {
  const room = await hostelService.updateHostelRoom(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_HOSTEL_ROOM", resource: "hostel_room", resourceId: room.id });
  res.json({ room });
});

export const listAllocations = asyncHandler(async (req: Request, res: Response) => {
  const { hostelRoomId, status } = req.query as Record<string, string>;
  const allocations = await hostelService.listAllocations(req.user!.schoolId, { hostelRoomId, status });
  res.json({ allocations });
});

export const createAllocation = asyncHandler(async (req: Request, res: Response) => {
  const allocation = await hostelService.createAllocation(req.user!.schoolId, req.body);
  await recordAudit({
    req,
    action: "CREATE_HOSTEL_ALLOCATION",
    resource: "hostel_allocation",
    resourceId: allocation.id,
  });
  res.status(201).json({ allocation });
});

export const checkoutAllocation = asyncHandler(async (req: Request, res: Response) => {
  const allocation = await hostelService.checkoutAllocation(req.user!.schoolId, req.params.id, req.body.checkOutDate);
  await recordAudit({
    req,
    action: "CHECKOUT_HOSTEL_ALLOCATION",
    resource: "hostel_allocation",
    resourceId: allocation.id,
  });
  res.json({ allocation });
});

export const getStudentAllocation = asyncHandler(async (req: Request, res: Response) => {
  let studentId = req.params.id;
  if (!req.user!.permissions.includes("hostel:read") && !req.user!.permissions.includes("hostel:manage")) {
    studentId = await getOwnStudentId(req.user!.schoolId, req.user!.id);
  }
  const allocation = await hostelService.getActiveAllocationForStudent(req.user!.schoolId, studentId);
  res.json({ allocation });
});
