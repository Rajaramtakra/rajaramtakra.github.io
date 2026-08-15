import type { Request, Response } from "express";
import * as attendanceService from "./attendance.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const markStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
  const records = await attendanceService.markStudentAttendance(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({
    req,
    action: "MARK_STUDENT_ATTENDANCE",
    resource: "attendance_student",
    metadata: { sectionId: req.body.sectionId, date: req.body.date, count: records.length },
  });
  res.status(201).json({ records });
});

export const listStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { sectionId, studentId, date, fromDate, toDate } = req.query as Record<string, string>;
  const records = await attendanceService.listStudentAttendanceForCaller(
    req.user!.schoolId,
    { userId: req.user!.id, permissions: req.user!.permissions },
    {
      sectionId,
      studentId,
      date: date ? new Date(date) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    }
  );
  res.json({ records });
});

export const markStaffAttendance = asyncHandler(async (req: Request, res: Response) => {
  const record = await attendanceService.markStaffAttendance(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "MARK_STAFF_ATTENDANCE", resource: "attendance_staff", resourceId: record.id });
  res.status(201).json({ record });
});

export const listStaffAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, staffId, date, fromDate, toDate } = req.query as Record<string, string>;
  const records = await attendanceService.listStaffAttendanceForCaller(
    req.user!.schoolId,
    { userId: req.user!.id, permissions: req.user!.permissions },
    {
      teacherId,
      staffId,
      date: date ? new Date(date) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    }
  );
  res.json({ records });
});
