import type { Request, Response } from "express";
import type { ListEnquiriesQuery, ListStudentRequestsQuery } from "@erp/shared";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";
import * as receptionService from "./reception.service";

export const createEnquiry = asyncHandler(async (req: Request, res: Response) => {
  const enquiry = await receptionService.createEnquiry(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "CREATE_ENQUIRY", resource: "enquiry", resourceId: enquiry.id });
  res.status(201).json({ enquiry });
});

export const listEnquiries = asyncHandler(async (req: Request, res: Response) => {
  const enquiries = await receptionService.listEnquiries(req.user!.schoolId, req.query as unknown as ListEnquiriesQuery);
  res.json({ enquiries });
});

export const getEnquiry = asyncHandler(async (req: Request, res: Response) => {
  const enquiry = await receptionService.getEnquiry(req.user!.schoolId, req.params.id);
  res.json({ enquiry });
});

export const updateEnquiry = asyncHandler(async (req: Request, res: Response) => {
  const enquiry = await receptionService.updateEnquiry(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_ENQUIRY", resource: "enquiry", resourceId: enquiry.id });
  res.json({ enquiry });
});

export const convertEnquiry = asyncHandler(async (req: Request, res: Response) => {
  const result = await receptionService.convertEnquiry(req.user!.schoolId, req.params.id, req.user!.id, req.body);
  await recordAudit({
    req,
    action: "CONVERT_ENQUIRY",
    resource: "enquiry",
    resourceId: req.params.id,
    metadata: { admissionApplicationId: result.application.id },
  });
  res.status(201).json(result);
});

export const getStudentSiblings = asyncHandler(async (req: Request, res: Response) => {
  const siblings = await receptionService.getSiblings(req.user!.schoolId, req.params.id);
  res.json({ siblings });
});

export const createStudentRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await receptionService.createStudentRequest(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_STUDENT_REQUEST", resource: "student_request", resourceId: request.id });
  res.status(201).json({ request });
});

export const listStudentRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await receptionService.listStudentRequests(
    req.user!.schoolId,
    req.query as unknown as ListStudentRequestsQuery
  );
  res.json({ requests });
});

export const updateStudentRequestStatus = asyncHandler(async (req: Request, res: Response) => {
  const request = await receptionService.updateStudentRequestStatus(
    req.user!.schoolId,
    req.params.id,
    req.user!.id,
    req.body
  );
  await recordAudit({ req, action: "UPDATE_STUDENT_REQUEST", resource: "student_request", resourceId: request.id });
  res.json({ request });
});

export const createPtmMeeting = asyncHandler(async (req: Request, res: Response) => {
  const meeting = await receptionService.createPtmMeeting(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "CREATE_PTM_MEETING", resource: "ptm_meeting", resourceId: meeting.id });
  res.status(201).json({ meeting });
});

export const listPtmMeetings = asyncHandler(async (req: Request, res: Response) => {
  const { sectionId } = req.query as Record<string, string>;
  const meetings = await receptionService.listPtmMeetings(req.user!.schoolId, { sectionId });
  res.json({ meetings });
});

export const getPtmMeeting = asyncHandler(async (req: Request, res: Response) => {
  const meeting = await receptionService.getPtmMeeting(req.user!.schoolId, req.params.id);
  res.json({ meeting });
});

export const recordPtmAttendance = asyncHandler(async (req: Request, res: Response) => {
  const attendances = await receptionService.recordPtmAttendance(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "RECORD_PTM_ATTENDANCE", resource: "ptm_meeting", resourceId: req.params.id });
  res.json({ attendances });
});
