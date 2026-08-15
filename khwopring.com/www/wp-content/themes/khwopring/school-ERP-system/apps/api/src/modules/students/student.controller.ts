import type { Request, Response } from "express";
import * as studentService from "./student.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";
import { storage } from "../../lib/storage";
import { BadRequestError } from "../../lib/errors";

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.getStudent(req.user!.schoolId, req.params.id, {
    userId: req.user!.id,
    permissions: req.user!.permissions,
  });
  res.json({ student });
});

export const searchStudents = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search, sortBy, sortDir, classId, sectionId, status } = req.query as Record<string, string>;
  const result = await studentService.searchStudents(
    req.user!.schoolId,
    { page: Number(page), pageSize: Number(pageSize), search, sortBy, sortDir: sortDir as "asc" | "desc" },
    { classId, sectionId, status: status as never }
  );
  res.json(result);
});

export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestError("A photo file is required");
  const { filePath } = await storage.save(req.file.buffer, req.file.originalname, `students/${req.params.id}`);
  const student = await studentService.setPhoto(req.user!.schoolId, req.params.id, filePath);
  await recordAudit({ req, action: "UPLOAD_STUDENT_PHOTO", resource: "student", resourceId: student.id });
  res.status(201).json({ student });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.updateProfile(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_PROFILE", resource: "student", resourceId: student.id });
  res.json({ student });
});

export const addGuardian = asyncHandler(async (req: Request, res: Response) => {
  const link = await studentService.addGuardian(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "ADD_GUARDIAN", resource: "student", resourceId: req.params.id });
  res.status(201).json({ studentGuardian: link });
});

export const addEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const contact = await studentService.addEmergencyContact(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "ADD_EMERGENCY_CONTACT", resource: "student", resourceId: req.params.id });
  res.status(201).json({ emergencyContact: contact });
});

export const promoteStudents = asyncHandler(async (req: Request, res: Response) => {
  const students = await studentService.promoteStudents(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "PROMOTE", resource: "student", metadata: { count: students.length } });
  res.json({ students });
});

export const suspendStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.suspendStudent(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "SUSPEND", resource: "student", resourceId: student.id });
  res.json({ student });
});

export const reinstateStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.reinstateStudent(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "REINSTATE", resource: "student", resourceId: student.id });
  res.json({ student });
});

export const rusticateStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.rusticateStudent(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "RUSTICATE", resource: "student", resourceId: student.id });
  res.json({ student });
});

export const issueTransferCertificate = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.issueTransferCertificate(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "ISSUE_TC", resource: "student", resourceId: student.id });
  res.json({ student });
});

export const convertToAlumni = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.convertToAlumni(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "ALUMNI_CONVERT", resource: "student", resourceId: student.id });
  res.json({ student });
});

export const enablePortalAccess = asyncHandler(async (req: Request, res: Response) => {
  const { student, temporaryPassword } = await studentService.enableStudentPortalAccess(
    req.user!.schoolId,
    req.params.id
  );
  await recordAudit({ req, action: "ENABLE_STUDENT_PORTAL_ACCESS", resource: "student", resourceId: student.id });
  res.status(201).json({ student, temporaryPassword });
});
