import type { Request, Response } from "express";
import * as academicService from "./academic.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const createAcademicSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await academicService.createAcademicSession(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE", resource: "academic_session", resourceId: session.id });
  res.status(201).json({ session });
});

export const listAcademicSessions = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await academicService.listAcademicSessions(req.user!.schoolId);
  res.json({ sessions });
});

export const setCurrentSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await academicService.setCurrentSession(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "SET_CURRENT", resource: "academic_session", resourceId: session.id });
  res.json({ session });
});

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const created = await academicService.createClass(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE", resource: "class", resourceId: created.id });
  res.status(201).json({ class: created });
});

export const listClasses = asyncHandler(async (req: Request, res: Response) => {
  const classes = await academicService.listClasses(req.user!.schoolId, req.query.academicSessionId as string | undefined);
  res.json({ classes });
});

export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await academicService.createSection(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE", resource: "section", resourceId: section.id });
  res.status(201).json({ section });
});

export const listSections = asyncHandler(async (req: Request, res: Response) => {
  const sections = await academicService.listSections(req.user!.schoolId, req.query.classId as string | undefined);
  res.json({ sections });
});

export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const subject = await academicService.createSubject(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE", resource: "subject", resourceId: subject.id });
  res.status(201).json({ subject });
});

export const listSubjects = asyncHandler(async (req: Request, res: Response) => {
  const subjects = await academicService.listSubjects(req.user!.schoolId);
  res.json({ subjects });
});

export const assignSubject = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await academicService.assignSubject(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "ASSIGN", resource: "subject_assignment", resourceId: assignment.id });
  res.status(201).json({ assignment });
});

export const listSubjectAssignments = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await academicService.listSubjectAssignments(
    req.user!.schoolId,
    req.query.sectionId as string | undefined
  );
  res.json({ assignments });
});

export const assignSectionCoordinator = asyncHandler(async (req: Request, res: Response) => {
  const section = await academicService.assignSectionCoordinator(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "ASSIGN_COORDINATOR", resource: "section", resourceId: section.id });
  res.json({ section });
});

export const createSyllabus = asyncHandler(async (req: Request, res: Response) => {
  const syllabus = await academicService.createSyllabus(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE", resource: "syllabus", resourceId: syllabus.id });
  res.status(201).json({ syllabus });
});

export const listSyllabi = asyncHandler(async (req: Request, res: Response) => {
  const syllabi = await academicService.listSyllabi(req.user!.schoolId, {
    classId: req.query.classId as string | undefined,
    subjectId: req.query.subjectId as string | undefined,
    academicSessionId: req.query.academicSessionId as string | undefined,
  });
  res.json({ syllabi });
});

export const getSyllabus = asyncHandler(async (req: Request, res: Response) => {
  const syllabus = await academicService.getSyllabus(req.user!.schoolId, req.params.id);
  res.json({ syllabus });
});

export const updateSyllabus = asyncHandler(async (req: Request, res: Response) => {
  const syllabus = await academicService.updateSyllabus(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE", resource: "syllabus", resourceId: syllabus.id });
  res.json({ syllabus });
});

export const createChapter = asyncHandler(async (req: Request, res: Response) => {
  const chapter = await academicService.createChapter(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "CREATE", resource: "chapter", resourceId: chapter.id });
  res.status(201).json({ chapter });
});

export const updateChapter = asyncHandler(async (req: Request, res: Response) => {
  const chapter = await academicService.updateChapter(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE", resource: "chapter", resourceId: chapter.id });
  res.json({ chapter });
});

export const deleteChapter = asyncHandler(async (req: Request, res: Response) => {
  await academicService.deleteChapter(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "DELETE", resource: "chapter", resourceId: req.params.id });
  res.status(204).send();
});
