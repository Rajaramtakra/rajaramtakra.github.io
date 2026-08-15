import type { Request, Response } from "express";
import * as examService from "./exam.service";
import * as reportCardService from "./reportCard.service";
import * as admitCardService from "./admitCard.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await examService.createExam(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE", resource: "exam", resourceId: exam.id });
  res.status(201).json({ exam });
});

export const listExams = asyncHandler(async (req: Request, res: Response) => {
  const exams = await examService.listExams(req.user!.schoolId, req.query.academicSessionId as string | undefined);
  res.json({ exams });
});

export const getExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await examService.getExam(req.user!.schoolId, req.params.id);
  res.json({ exam });
});

export const createExamSchedule = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await examService.createExamSchedule(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE", resource: "exam_schedule", resourceId: schedule.id });
  res.status(201).json({ schedule });
});

export const listExamSchedules = asyncHandler(async (req: Request, res: Response) => {
  const { examId, sectionId } = req.query as Record<string, string>;
  const schedules = await examService.listExamSchedules(req.user!.schoolId, examId, sectionId);
  res.json({ schedules });
});

export const createGradeScale = asyncHandler(async (req: Request, res: Response) => {
  const gradeScale = await examService.createGradeScale(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE", resource: "grade_scale", resourceId: gradeScale.id });
  res.status(201).json({ gradeScale });
});

export const listGradeScales = asyncHandler(async (req: Request, res: Response) => {
  const gradeScales = await examService.listGradeScales(req.user!.schoolId);
  res.json({ gradeScales });
});

export const enterMarks = asyncHandler(async (req: Request, res: Response) => {
  const marks = await examService.enterMarks(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({
    req,
    action: "ENTER_MARKS",
    resource: "mark",
    metadata: { examScheduleId: req.body.examScheduleId, count: marks.length },
  });
  res.status(201).json({ marks });
});

export const listMarks = asyncHandler(async (req: Request, res: Response) => {
  const { examScheduleId } = req.query as Record<string, string>;
  const marks = await examService.listMarks(req.user!.schoolId, examScheduleId);
  res.json({ marks });
});

export const listReportCards = asyncHandler(async (req: Request, res: Response) => {
  const { examId, sectionId } = req.query as Record<string, string>;
  const reportCards = await reportCardService.listReportCardsForCaller(
    req.user!.schoolId,
    { userId: req.user!.id, permissions: req.user!.permissions },
    { examId, sectionId }
  );
  res.json({ reportCards });
});

export const getReportCard = asyncHandler(async (req: Request, res: Response) => {
  const reportCard = await reportCardService.getReportCardForCaller(
    req.user!.schoolId,
    { userId: req.user!.id, permissions: req.user!.permissions },
    req.params.id
  );
  const subjectMarks = await reportCardService.getReportCardSubjectMarks(reportCard.examId, reportCard.studentId);
  res.json({ reportCard, subjectMarks });
});

export const publishReportCards = asyncHandler(async (req: Request, res: Response) => {
  const reportCards = await reportCardService.publishReportCards(req.user!.schoolId, req.body);
  await recordAudit({
    req,
    action: "PUBLISH",
    resource: "report_card",
    metadata: { examId: req.body.examId, sectionId: req.body.sectionId, count: reportCards.length },
  });
  res.json({ reportCards });
});

export const upsertCoScholasticGrade = asyncHandler(async (req: Request, res: Response) => {
  const grade = await examService.upsertCoScholasticGrade(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "UPSERT", resource: "co_scholastic_grade", resourceId: grade.id });
  res.status(201).json({ grade });
});

export const listCoScholasticGrades = asyncHandler(async (req: Request, res: Response) => {
  const { examId, studentId } = req.query as Record<string, string>;
  const grades = await examService.listCoScholasticGrades(req.user!.schoolId, examId, studentId);
  res.json({ grades });
});

export const bulkDownloadAdmitCardsPdf = asyncHandler(async (req: Request, res: Response) => {
  const buffer = await admitCardService.bulkGenerateAdmitCardsPdf(
    req.user!.schoolId,
    req.params.examId,
    req.params.sectionId
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="admit-cards-${req.params.examId}.pdf"`);
  res.send(buffer);
});
