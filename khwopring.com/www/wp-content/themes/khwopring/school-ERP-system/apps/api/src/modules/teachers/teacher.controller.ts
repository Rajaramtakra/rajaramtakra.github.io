import type { Request, Response } from "express";
import * as teacherService from "./teacher.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";
import { storage } from "../../lib/storage";
import { BadRequestError } from "../../lib/errors";

export const searchTeachers = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search, sortBy, sortDir, employmentStatus } = req.query as Record<string, string>;
  const result = await teacherService.searchTeachers(
    req.user!.schoolId,
    { page: Number(page), pageSize: Number(pageSize), search, sortBy, sortDir: sortDir as "asc" | "desc" },
    { employmentStatus: employmentStatus as never }
  );
  res.json(result);
});

export const getTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await teacherService.getTeacher(req.user!.schoolId, req.params.id);
  res.json({ teacher });
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await teacherService.getMyProfile(req.user!.schoolId, req.user!.id);
  res.json({ teacher });
});

export const createTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { teacher, temporaryPassword } = await teacherService.createTeacher(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_TEACHER", resource: "teacher", resourceId: teacher.id });
  res.status(201).json({ teacher, temporaryPassword });
});

export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestError("A photo file is required");
  const { filePath } = await storage.save(req.file.buffer, req.file.originalname, `teachers/${req.params.id}`);
  const teacher = await teacherService.setPhoto(req.user!.schoolId, req.params.id, filePath);
  await recordAudit({ req, action: "UPLOAD_TEACHER_PHOTO", resource: "teacher", resourceId: teacher.id });
  res.status(201).json({ teacher });
});

export const updateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await teacherService.updateTeacher(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_TEACHER", resource: "teacher", resourceId: teacher.id });
  res.json({ teacher });
});

export const updateEmploymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await teacherService.updateEmploymentStatus(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_EMPLOYMENT_STATUS", resource: "teacher", resourceId: teacher.id });
  res.json({ teacher });
});

export const addQualification = asyncHandler(async (req: Request, res: Response) => {
  const qualification = await teacherService.addQualification(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "ADD_QUALIFICATION", resource: "teacher", resourceId: req.params.id });
  res.status(201).json({ qualification });
});

export const addExperience = asyncHandler(async (req: Request, res: Response) => {
  const experience = await teacherService.addExperience(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "ADD_EXPERIENCE", resource: "teacher", resourceId: req.params.id });
  res.status(201).json({ experience });
});
