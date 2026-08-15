import { Router } from "express";
import {
  createApplicationSchema,
  createCandidateSchema,
  createJobPostingSchema,
  createLeaveRequestSchema,
  createStaffMemberSchema,
  decideLeaveRequestSchema,
  issueOfferLetterSchema,
  promoteStaffSchema,
  scheduleInterviewSchema,
  submitInterviewFeedbackSchema,
  updateApplicationStatusSchema,
  updateInterviewStatusSchema,
  updateJobPostingSchema,
  updateJobPostingStatusSchema,
  updateStaffMemberSchema,
  updateStaffStatusSchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { upload } from "../../middleware/upload.middleware";
import * as controller from "./hr.controller";

export const hrRouter = Router();
hrRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: HR & Recruitment
 *   description: Job postings, candidate pipeline, interviews, offers, staff members and leave requests
 */

// ---------------------------------------------------------------------------
// Job postings
// ---------------------------------------------------------------------------

hrRouter.post(
  "/job-postings",
  requirePermission("hr_recruitment:manage"),
  validateBody(createJobPostingSchema),
  controller.createJobPosting
);
hrRouter.get(
  "/job-postings",
  requirePermission("hr_recruitment:manage", "hr_recruitment:read"),
  controller.listJobPostings
);
hrRouter.get(
  "/job-postings/:id",
  requirePermission("hr_recruitment:manage", "hr_recruitment:read"),
  controller.getJobPosting
);
hrRouter.patch(
  "/job-postings/:id",
  requirePermission("hr_recruitment:manage"),
  validateBody(updateJobPostingSchema),
  controller.updateJobPosting
);
hrRouter.post(
  "/job-postings/:id/status",
  requirePermission("hr_recruitment:manage"),
  validateBody(updateJobPostingStatusSchema),
  controller.updateJobPostingStatus
);

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------

hrRouter.post(
  "/candidates",
  requirePermission("hr_recruitment:manage"),
  validateBody(createCandidateSchema),
  controller.createCandidate
);
hrRouter.get(
  "/candidates",
  requirePermission("hr_recruitment:manage", "hr_recruitment:read"),
  controller.listCandidates
);
hrRouter.get(
  "/candidates/:id",
  requirePermission("hr_recruitment:manage", "hr_recruitment:read"),
  controller.getCandidate
);
hrRouter.post(
  "/candidates/:id/resume",
  requirePermission("hr_recruitment:manage"),
  upload.single("file"),
  controller.uploadResume
);

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

hrRouter.post(
  "/applications",
  requirePermission("hr_recruitment:manage"),
  validateBody(createApplicationSchema),
  controller.createApplication
);
hrRouter.get(
  "/applications",
  requirePermission("hr_recruitment:manage", "hr_recruitment:read"),
  controller.listApplications
);
hrRouter.get(
  "/applications/:id",
  requirePermission("hr_recruitment:manage", "hr_recruitment:read"),
  controller.getApplication
);
hrRouter.post(
  "/applications/:id/status",
  requirePermission("hr_recruitment:manage"),
  validateBody(updateApplicationStatusSchema),
  controller.updateApplicationStatus
);
hrRouter.post(
  "/applications/:id/offer-letter",
  requirePermission("hr_recruitment:manage"),
  validateBody(issueOfferLetterSchema),
  controller.issueOfferLetter
);
hrRouter.post(
  "/applications/:id/offer-letter/accept",
  requirePermission("hr_recruitment:manage"),
  controller.acceptOfferLetter
);
hrRouter.post(
  "/applications/:id/convert-to-staff",
  requirePermission("hr_recruitment:manage"),
  requirePermission("staff:manage"),
  controller.convertToStaff
);

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------

hrRouter.post(
  "/interviews",
  requirePermission("hr_recruitment:manage"),
  validateBody(scheduleInterviewSchema),
  controller.scheduleInterview
);
hrRouter.get(
  "/interviews",
  requirePermission("hr_recruitment:manage", "hr_recruitment:read"),
  controller.listInterviews
);
hrRouter.get(
  "/interviews/:id",
  requirePermission("hr_recruitment:manage", "hr_recruitment:read"),
  controller.getInterview
);
hrRouter.post(
  "/interviews/:id/status",
  requirePermission("hr_recruitment:manage"),
  validateBody(updateInterviewStatusSchema),
  controller.updateInterviewStatus
);
hrRouter.post(
  "/interviews/:id/feedback",
  requirePermission("hr_recruitment:manage"),
  validateBody(submitInterviewFeedbackSchema),
  controller.submitInterviewFeedback
);

// ---------------------------------------------------------------------------
// Staff members
// ---------------------------------------------------------------------------

hrRouter.post(
  "/staff",
  requirePermission("staff:manage"),
  validateBody(createStaffMemberSchema),
  controller.createStaffMember
);
hrRouter.get("/staff", requirePermission("staff:manage"), controller.searchStaffMembers);
hrRouter.get("/staff/me", controller.getMyStaffProfile);
hrRouter.get("/staff/:id", requirePermission("staff:manage"), controller.getStaffMember);
hrRouter.post(
  "/staff/:id/photo",
  requirePermission("staff:manage"),
  upload.single("file"),
  controller.uploadStaffPhoto
);
hrRouter.patch(
  "/staff/:id",
  requirePermission("staff:manage"),
  validateBody(updateStaffMemberSchema),
  controller.updateStaffMember
);
hrRouter.post(
  "/staff/:id/status",
  requirePermission("staff:manage"),
  validateBody(updateStaffStatusSchema),
  controller.updateStaffStatus
);
hrRouter.post(
  "/staff/:id/promote",
  requirePermission("staff:manage"),
  validateBody(promoteStaffSchema),
  controller.promoteStaffMember
);
hrRouter.get(
  "/staff/:id/promotion-history",
  requirePermission("staff:manage"),
  controller.listStaffPromotionHistory
);

// ---------------------------------------------------------------------------
// Leave requests
// ---------------------------------------------------------------------------

hrRouter.post("/leave-requests", validateBody(createLeaveRequestSchema), controller.createLeaveRequest);
hrRouter.get("/leave-requests", requirePermission("staff:manage"), controller.listAllLeaveRequests);
hrRouter.get("/leave-requests/mine", controller.listMyLeaveRequests);
hrRouter.post(
  "/leave-requests/:id/decide",
  requirePermission("staff:manage"),
  validateBody(decideLeaveRequestSchema),
  controller.decideLeaveRequest
);
