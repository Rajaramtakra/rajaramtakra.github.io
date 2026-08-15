import type { Request, Response } from "express";
import * as recruitmentService from "./recruitment.service";
import * as staffService from "./staffMember.service";
import * as leaveService from "./leave.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";
import { BadRequestError } from "../../lib/errors";
import { storage } from "../../lib/storage";

function paginationFromQuery(req: Request) {
  const { page, pageSize, search, sortBy, sortDir } = req.query as Record<string, string>;
  return { page: Number(page), pageSize: Number(pageSize), search, sortBy, sortDir: sortDir as "asc" | "desc" };
}

// ---------------------------------------------------------------------------
// Job postings
// ---------------------------------------------------------------------------

export const createJobPosting = asyncHandler(async (req: Request, res: Response) => {
  const jobPosting = await recruitmentService.createJobPosting(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "CREATE_JOB_POSTING", resource: "job_posting", resourceId: jobPosting.id });
  res.status(201).json({ jobPosting });
});

export const listJobPostings = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as Record<string, string>;
  const result = await recruitmentService.listJobPostings(req.user!.schoolId, paginationFromQuery(req), {
    status: status as never,
  });
  res.json(result);
});

export const getJobPosting = asyncHandler(async (req: Request, res: Response) => {
  const jobPosting = await recruitmentService.getJobPosting(req.user!.schoolId, req.params.id);
  res.json({ jobPosting });
});

export const updateJobPosting = asyncHandler(async (req: Request, res: Response) => {
  const jobPosting = await recruitmentService.updateJobPosting(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_JOB_POSTING", resource: "job_posting", resourceId: jobPosting.id });
  res.json({ jobPosting });
});

export const updateJobPostingStatus = asyncHandler(async (req: Request, res: Response) => {
  const jobPosting = await recruitmentService.updateJobPostingStatus(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_JOB_POSTING_STATUS", resource: "job_posting", resourceId: jobPosting.id, metadata: req.body });
  res.json({ jobPosting });
});

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------

export const createCandidate = asyncHandler(async (req: Request, res: Response) => {
  const candidate = await recruitmentService.createCandidate(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_CANDIDATE", resource: "candidate", resourceId: candidate.id });
  res.status(201).json({ candidate });
});

export const listCandidates = asyncHandler(async (req: Request, res: Response) => {
  const result = await recruitmentService.listCandidates(req.user!.schoolId, paginationFromQuery(req));
  res.json(result);
});

export const getCandidate = asyncHandler(async (req: Request, res: Response) => {
  const candidate = await recruitmentService.getCandidate(req.user!.schoolId, req.params.id);
  res.json({ candidate });
});

export const uploadResume = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestError("A file is required");
  const candidate = await recruitmentService.uploadResume(req.user!.schoolId, req.params.id, req.file);
  await recordAudit({ req, action: "UPLOAD_RESUME", resource: "candidate", resourceId: candidate.id });
  res.status(201).json({ candidate });
});

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export const createApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await recruitmentService.createApplication(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_APPLICATION", resource: "candidate_application", resourceId: application.id });
  res.status(201).json({ application });
});

export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const { jobPostingId, candidateId, status } = req.query as Record<string, string>;
  const result = await recruitmentService.listApplications(req.user!.schoolId, paginationFromQuery(req), {
    jobPostingId,
    candidateId,
    status: status as never,
  });
  res.json(result);
});

export const getApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await recruitmentService.getApplication(req.user!.schoolId, req.params.id);
  res.json({ application });
});

export const updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const application = await recruitmentService.updateApplicationStatus(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_APPLICATION_STATUS", resource: "candidate_application", resourceId: application.id, metadata: req.body });
  res.json({ application });
});

export const issueOfferLetter = asyncHandler(async (req: Request, res: Response) => {
  const offerLetter = await recruitmentService.issueOfferLetter(req.user!.schoolId, req.params.id, req.user!.id, req.body);
  await recordAudit({ req, action: "ISSUE_OFFER_LETTER", resource: "offer_letter", resourceId: offerLetter.id });
  res.status(201).json({ offerLetter });
});

export const acceptOfferLetter = asyncHandler(async (req: Request, res: Response) => {
  const offerLetter = await recruitmentService.acceptOfferLetter(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "ACCEPT_OFFER_LETTER", resource: "offer_letter", resourceId: offerLetter.id });
  res.json({ offerLetter });
});

export const convertToStaff = asyncHandler(async (req: Request, res: Response) => {
  const result = await recruitmentService.convertToStaff(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "CONVERT_TO_STAFF", resource: "staff_member", resourceId: result.staffMember.id });
  res.status(201).json(result);
});

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------

export const scheduleInterview = asyncHandler(async (req: Request, res: Response) => {
  const interview = await recruitmentService.scheduleInterview(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "SCHEDULE_INTERVIEW", resource: "interview", resourceId: interview.id });
  res.status(201).json({ interview });
});

export const listInterviews = asyncHandler(async (req: Request, res: Response) => {
  const { candidateApplicationId } = req.query as Record<string, string>;
  const interviews = await recruitmentService.listInterviews(req.user!.schoolId, { candidateApplicationId });
  res.json({ interviews });
});

export const getInterview = asyncHandler(async (req: Request, res: Response) => {
  const interview = await recruitmentService.getInterview(req.user!.schoolId, req.params.id);
  res.json({ interview });
});

export const updateInterviewStatus = asyncHandler(async (req: Request, res: Response) => {
  const interview = await recruitmentService.updateInterviewStatus(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_INTERVIEW_STATUS", resource: "interview", resourceId: interview.id, metadata: req.body });
  res.json({ interview });
});

export const submitInterviewFeedback = asyncHandler(async (req: Request, res: Response) => {
  const feedback = await recruitmentService.submitInterviewFeedback(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "SUBMIT_INTERVIEW_FEEDBACK", resource: "interview_feedback", resourceId: feedback.id });
  res.status(201).json({ feedback });
});

// ---------------------------------------------------------------------------
// Staff members
// ---------------------------------------------------------------------------

export const createStaffMember = asyncHandler(async (req: Request, res: Response) => {
  const { staffMember, temporaryPassword } = await staffService.createStaffMember(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_STAFF_MEMBER", resource: "staff_member", resourceId: staffMember.id });
  res.status(201).json({ staffMember, temporaryPassword });
});

export const searchStaffMembers = asyncHandler(async (req: Request, res: Response) => {
  const { employmentStatus, department } = req.query as Record<string, string>;
  const result = await staffService.searchStaffMembers(req.user!.schoolId, paginationFromQuery(req), {
    employmentStatus: employmentStatus as never,
    department,
  });
  res.json(result);
});

export const getStaffMember = asyncHandler(async (req: Request, res: Response) => {
  const staffMember = await staffService.getStaffMember(req.user!.schoolId, req.params.id);
  res.json({ staffMember });
});

export const getMyStaffProfile = asyncHandler(async (req: Request, res: Response) => {
  const staffMember = await staffService.getMyStaffProfile(req.user!.schoolId, req.user!.id);
  res.json({ staffMember });
});

export const uploadStaffPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestError("A photo file is required");
  const { filePath } = await storage.save(req.file.buffer, req.file.originalname, `staff/${req.params.id}`);
  const staffMember = await staffService.setPhoto(req.user!.schoolId, req.params.id, filePath);
  await recordAudit({ req, action: "UPLOAD_STAFF_PHOTO", resource: "staff_member", resourceId: staffMember.id });
  res.status(201).json({ staffMember });
});

export const updateStaffMember = asyncHandler(async (req: Request, res: Response) => {
  const staffMember = await staffService.updateStaffMember(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_STAFF_MEMBER", resource: "staff_member", resourceId: staffMember.id });
  res.json({ staffMember });
});

export const updateStaffStatus = asyncHandler(async (req: Request, res: Response) => {
  const staffMember = await staffService.updateEmploymentStatus(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_STAFF_STATUS", resource: "staff_member", resourceId: staffMember.id, metadata: req.body });
  res.json({ staffMember });
});

export const promoteStaffMember = asyncHandler(async (req: Request, res: Response) => {
  const staffMember = await staffService.promoteStaffMember(req.user!.schoolId, req.params.id, req.user!.id, req.body);
  await recordAudit({ req, action: "PROMOTE_STAFF_MEMBER", resource: "staff_member", resourceId: staffMember.id, metadata: req.body });
  res.json({ staffMember });
});

export const listStaffPromotionHistory = asyncHandler(async (req: Request, res: Response) => {
  const promotionHistory = await staffService.listPromotionHistory(req.user!.schoolId, req.params.id);
  res.json({ promotionHistory });
});

// ---------------------------------------------------------------------------
// Leave requests
// ---------------------------------------------------------------------------

export const createLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const leaveRequest = await leaveService.createLeaveRequest(
    req.user!.schoolId,
    { id: req.user!.id, permissions: req.user!.permissions },
    req.body
  );
  await recordAudit({ req, action: "CREATE_LEAVE_REQUEST", resource: "leave_request", resourceId: leaveRequest.id });
  res.status(201).json({ leaveRequest });
});

export const listAllLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as Record<string, string>;
  const leaveRequests = await leaveService.listAllLeaveRequests(req.user!.schoolId, { status: status as never });
  res.json({ leaveRequests });
});

export const listMyLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
  const leaveRequests = await leaveService.listMyLeaveRequests(req.user!.schoolId, req.user!.id);
  res.json({ leaveRequests });
});

export const decideLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const leaveRequest = await leaveService.decideLeaveRequest(req.user!.schoolId, req.params.id, req.user!.id, req.body);
  await recordAudit({ req, action: "DECIDE_LEAVE_REQUEST", resource: "leave_request", resourceId: leaveRequest.id, metadata: req.body });
  res.json({ leaveRequest });
});
