import { z } from "zod";
import { EMPLOYMENT_STATUSES } from "../enums";

export const JOB_POSTING_STATUSES = ["OPEN", "CLOSED", "ON_HOLD"] as const;
export type JobPostingStatus = (typeof JOB_POSTING_STATUSES)[number];

export const CANDIDATE_APPLICATION_STATUSES = [
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "OFFERED",
  "REJECTED",
  "WITHDRAWN",
  "HIRED",
] as const;
export type CandidateApplicationStatus = (typeof CANDIDATE_APPLICATION_STATUSES)[number];

export const INTERVIEW_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const INTERVIEW_RECOMMENDATIONS = ["STRONG_YES", "YES", "NO", "STRONG_NO"] as const;
export type InterviewRecommendation = (typeof INTERVIEW_RECOMMENDATIONS)[number];

export const LEAVE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

// ---------------------------------------------------------------------------
// Job postings
// ---------------------------------------------------------------------------

export const createJobPostingSchema = z.object({
  title: z.string().min(2).max(150),
  department: z.string().min(1).max(100),
  description: z.string().min(5).max(5000),
  requirements: z.string().max(5000).optional(),
  openings: z.coerce.number().int().min(1).max(999).default(1),
});
export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;

export const updateJobPostingSchema = createJobPostingSchema.partial();
export type UpdateJobPostingInput = z.infer<typeof updateJobPostingSchema>;

export const updateJobPostingStatusSchema = z.object({
  status: z.enum(JOB_POSTING_STATUSES),
});
export type UpdateJobPostingStatusInput = z.infer<typeof updateJobPostingStatusSchema>;

export const jobPostingSearchSchema = z.object({
  status: z.enum(JOB_POSTING_STATUSES).optional(),
});
export type JobPostingSearchInput = z.infer<typeof jobPostingSearchSchema>;

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------

export const createCandidateSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  resumeUrl: z.string().max(500).optional(),
});
export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;

// ---------------------------------------------------------------------------
// Applications (candidate <-> job posting)
// ---------------------------------------------------------------------------

export const createApplicationSchema = z.object({
  jobPostingId: z.string().min(1),
  candidateId: z.string().min(1),
});
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationStatusSchema = z.object({
  status: z.enum(CANDIDATE_APPLICATION_STATUSES),
});
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------

export const scheduleInterviewSchema = z.object({
  candidateApplicationId: z.string().min(1),
  scheduledAt: z.coerce.date(),
  mode: z.string().max(60).optional(),
  interviewerId: z.string().min(1),
});
export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;

export const updateInterviewStatusSchema = z.object({
  status: z.enum(["CANCELLED", "NO_SHOW"]),
});
export type UpdateInterviewStatusInput = z.infer<typeof updateInterviewStatusSchema>;

export const submitInterviewFeedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  recommendation: z.enum(INTERVIEW_RECOMMENDATIONS),
  comments: z.string().max(2000).optional(),
});
export type SubmitInterviewFeedbackInput = z.infer<typeof submitInterviewFeedbackSchema>;

// ---------------------------------------------------------------------------
// Offer letters
// ---------------------------------------------------------------------------

export const issueOfferLetterSchema = z.object({
  position: z.string().min(1).max(150),
  salaryOffered: z.coerce.number().positive(),
  joiningDate: z.coerce.date(),
});
export type IssueOfferLetterInput = z.infer<typeof issueOfferLetterSchema>;

// ---------------------------------------------------------------------------
// Staff members
// ---------------------------------------------------------------------------

/** Roles assignable when creating a non-teaching staff account. Excludes TEACHER/STUDENT/PARENT (their own dedicated creation flows) and SUPER_ADMIN. */
export const STAFF_ASSIGNABLE_ROLES = [
  "SCHOOL_ADMIN",
  "PRINCIPAL",
  "ACCOUNTANT",
  "RECEPTIONIST",
  "LIBRARIAN",
  "TRANSPORT_MANAGER",
  "HR_MANAGER",
] as const;
export type StaffAssignableRole = (typeof STAFF_ASSIGNABLE_ROLES)[number];

export const createStaffMemberSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  department: z.string().min(1).max(100),
  designation: z.string().min(1).max(100),
  dateOfJoining: z.coerce.date(),
  role: z.enum(STAFF_ASSIGNABLE_ROLES),
});
export type CreateStaffMemberInput = z.infer<typeof createStaffMemberSchema>;

export const updateStaffMemberSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  department: z.string().min(1).max(100).optional(),
  designation: z.string().min(1).max(100).optional(),
});
export type UpdateStaffMemberInput = z.infer<typeof updateStaffMemberSchema>;

export const updateStaffStatusSchema = z.object({
  employmentStatus: z.enum(EMPLOYMENT_STATUSES),
});
export type UpdateStaffStatusInput = z.infer<typeof updateStaffStatusSchema>;

export const staffSearchSchema = z.object({
  employmentStatus: z.enum(EMPLOYMENT_STATUSES).optional(),
  department: z.string().optional(),
});
export type StaffSearchInput = z.infer<typeof staffSearchSchema>;

// ---------------------------------------------------------------------------
// Leave requests
// ---------------------------------------------------------------------------

export const createLeaveRequestSchema = z
  .object({
    teacherId: z.string().min(1).optional(),
    staffId: z.string().min(1).optional(),
    leaveType: z.string().min(1).max(60),
    fromDate: z.coerce.date(),
    toDate: z.coerce.date(),
    reason: z.string().min(3).max(1000),
  })
  .refine((data) => Boolean(data.teacherId) !== Boolean(data.staffId), {
    message: "Exactly one of teacherId or staffId must be provided",
    path: ["teacherId"],
  });
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;

export const decideLeaveRequestSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  comments: z.string().max(1000).optional(),
});
export type DecideLeaveRequestInput = z.infer<typeof decideLeaveRequestSchema>;

export const leaveRequestSearchSchema = z.object({
  status: z.enum(LEAVE_STATUSES).optional(),
});
export type LeaveRequestSearchInput = z.infer<typeof leaveRequestSearchSchema>;

// ---------------------------------------------------------------------------
// Staff promotions
// ---------------------------------------------------------------------------

export const promoteStaffSchema = z.object({
  toDesignation: z.string().min(1).max(100),
  toDepartment: z.string().min(1).max(100),
  remarks: z.string().max(1000).optional(),
});
export type PromoteStaffInput = z.infer<typeof promoteStaffSchema>;
