import type { Request, Response } from "express";
import { assignRoleSchema, revokeRoleSchema, type AssignRoleInput, type RevokeRoleInput } from "@erp/shared";
import * as schoolService from "./school.service";
import * as userManagementService from "./userManagement.service";
import * as holidayService from "./holiday.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";
import { storage } from "../../lib/storage";

export const getSchoolProfile = asyncHandler(async (req: Request, res: Response) => {
  const school = await schoolService.getSchoolProfile(req.user!.schoolId);
  res.json({ school });
});

export const updateSchoolProfile = asyncHandler(async (req: Request, res: Response) => {
  const input = { ...req.body };
  if (req.file) {
    const { filePath } = await storage.save(req.file.buffer, req.file.originalname, `schools/${req.user!.schoolId}`);
    input.logoUrl = filePath;
  }
  const school = await schoolService.updateSchoolProfile(req.user!.schoolId, input);
  await recordAudit({ req, action: "UPDATE_SCHOOL_PROFILE", resource: "school", resourceId: school.id });
  res.json({ school });
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search } = req.query as Record<string, string>;
  const result = await userManagementService.listUsers(req.user!.schoolId, {
    page: Number(page),
    pageSize: Number(pageSize),
    search,
  });
  res.json(result);
});

export const assignRole = asyncHandler(async (req: Request, res: Response) => {
  const input = assignRoleSchema.parse({ userId: req.params.id, roleId: req.body.roleId }) as AssignRoleInput;
  const userRole = await userManagementService.assignRole(req.user!.schoolId, input);
  await recordAudit({
    req,
    action: "ASSIGN_ROLE",
    resource: "user",
    resourceId: req.params.id,
    metadata: { roleId: input.roleId },
  });
  res.status(201).json({ userRole });
});

export const revokeRole = asyncHandler(async (req: Request, res: Response) => {
  const input = revokeRoleSchema.parse({ userId: req.params.id, roleId: req.params.roleId }) as RevokeRoleInput;
  await userManagementService.revokeRole(req.user!.schoolId, input);
  await recordAudit({
    req,
    action: "REVOKE_ROLE",
    resource: "user",
    resourceId: req.params.id,
    metadata: { roleId: input.roleId },
  });
  res.status(204).send();
});

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await userManagementService.listRoles(req.user!.schoolId);
  res.json({ roles });
});

export const listHolidays = asyncHandler(async (req: Request, res: Response) => {
  const holidays = await holidayService.listHolidays(req.user!.schoolId);
  res.json({ holidays });
});

export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const holiday = await holidayService.createHoliday(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_HOLIDAY", resource: "holiday", resourceId: holiday.id });
  res.status(201).json({ holiday });
});

export const deleteHoliday = asyncHandler(async (req: Request, res: Response) => {
  const holiday = await holidayService.deleteHoliday(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "DELETE_HOLIDAY", resource: "holiday", resourceId: holiday.id });
  res.status(204).send();
});
