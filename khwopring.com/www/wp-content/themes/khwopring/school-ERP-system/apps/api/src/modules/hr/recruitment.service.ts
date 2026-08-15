import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import type {
  CreateApplicationInput,
  CreateCandidateInput,
  CreateJobPostingInput,
  IssueOfferLetterInput,
  JobPostingSearchInput,
  ScheduleInterviewInput,
  SubmitInterviewFeedbackInput,
  UpdateApplicationStatusInput,
  UpdateInterviewStatusInput,
  UpdateJobPostingInput,
  UpdateJobPostingStatusInput,
} from "@erp/shared";
import type { CandidateApplicationStatus } from "@prisma/client";
import type { PaginationQuery } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors";
import { buildPaginationArgs, toPaginatedResult } from "../../lib/pagination";
import { renderPdfBuffer } from "../../lib/pdf";
import { storage } from "../../lib/storage";
import { generateStaffEmployeeCode } from "./staffMember.numbering";

const APPLICATION_INCLUDE = {
  candidate: true,
  jobPosting: true,
  interviews: { include: { interviewer: true, feedback: true }, orderBy: { scheduledAt: "desc" as const } },
  offerLetter: true,
} as const;

/** Pipeline state machine, mirrors admission.service.ts's ALLOWED_TRANSITIONS pattern. */
const ALLOWED_TRANSITIONS: Record<CandidateApplicationStatus, CandidateApplicationStatus[]> = {
  APPLIED: ["SHORTLISTED", "REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["INTERVIEW_SCHEDULED", "REJECTED", "WITHDRAWN"],
  INTERVIEW_SCHEDULED: ["INTERVIEWED", "REJECTED", "WITHDRAWN"],
  INTERVIEWED: ["OFFERED", "REJECTED", "WITHDRAWN"],
  OFFERED: ["HIRED", "REJECTED", "WITHDRAWN"],
  REJECTED: [],
  WITHDRAWN: [],
  HIRED: [],
};

function assertTransition(current: CandidateApplicationStatus, next: CandidateApplicationStatus) {
  if (!ALLOWED_TRANSITIONS[current].includes(next)) {
    throw new ConflictError(`Cannot move application from ${current} to ${next}`);
  }
}

function generateTemporaryPassword(): string {
  return `Erp@${randomBytes(5).toString("hex")}`;
}

// ---------------------------------------------------------------------------
// Job postings
// ---------------------------------------------------------------------------

async function findJobPostingOrThrow(schoolId: string, id: string) {
  const posting = await prisma.jobPosting.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!posting) throw new NotFoundError("Job posting not found");
  return posting;
}

export async function createJobPosting(schoolId: string, postedById: string, input: CreateJobPostingInput) {
  return prisma.jobPosting.create({
    data: {
      schoolId,
      title: input.title,
      department: input.department,
      description: input.description,
      requirements: input.requirements,
      openings: input.openings,
      postedById,
    },
  });
}

export async function listJobPostings(schoolId: string, pagination: PaginationQuery, filters: JobPostingSearchInput) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    deletedAt: null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(pagination.search
      ? {
          OR: [
            { title: { contains: pagination.search, mode: "insensitive" as const } },
            { department: { contains: pagination.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where,
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.jobPosting.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function getJobPosting(schoolId: string, id: string) {
  const posting = await prisma.jobPosting.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: { applications: { include: APPLICATION_INCLUDE } },
  });
  if (!posting) throw new NotFoundError("Job posting not found");
  return posting;
}

export async function updateJobPosting(schoolId: string, id: string, input: UpdateJobPostingInput) {
  await findJobPostingOrThrow(schoolId, id);
  return prisma.jobPosting.update({ where: { id }, data: input });
}

export async function updateJobPostingStatus(schoolId: string, id: string, input: UpdateJobPostingStatusInput) {
  await findJobPostingOrThrow(schoolId, id);
  return prisma.jobPosting.update({ where: { id }, data: { status: input.status } });
}

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------

async function findCandidateOrThrow(schoolId: string, id: string) {
  const candidate = await prisma.candidate.findFirst({ where: { id, schoolId } });
  if (!candidate) throw new NotFoundError("Candidate not found");
  return candidate;
}

export async function createCandidate(schoolId: string, input: CreateCandidateInput) {
  return prisma.candidate.create({ data: { schoolId, ...input } });
}

export async function listCandidates(schoolId: string, pagination: PaginationQuery) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    ...(pagination.search
      ? {
          OR: [
            { fullName: { contains: pagination.search, mode: "insensitive" as const } },
            { email: { contains: pagination.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.candidate.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.candidate.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function getCandidate(schoolId: string, id: string) {
  const candidate = await prisma.candidate.findFirst({
    where: { id, schoolId },
    include: { applications: { include: APPLICATION_INCLUDE } },
  });
  if (!candidate) throw new NotFoundError("Candidate not found");
  return candidate;
}

export async function uploadResume(schoolId: string, candidateId: string, file: Express.Multer.File) {
  await findCandidateOrThrow(schoolId, candidateId);
  const { filePath } = await storage.save(file.buffer, file.originalname, `candidates/${candidateId}`);
  return prisma.candidate.update({ where: { id: candidateId }, data: { resumeUrl: filePath } });
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

async function findApplicationOrThrow(schoolId: string, id: string) {
  const application = await prisma.candidateApplication.findFirst({
    where: { id, schoolId },
    include: APPLICATION_INCLUDE,
  });
  if (!application) throw new NotFoundError("Candidate application not found");
  return application;
}

export async function createApplication(schoolId: string, input: CreateApplicationInput) {
  const posting = await findJobPostingOrThrow(schoolId, input.jobPostingId);
  if (posting.status !== "OPEN") throw new ConflictError("This job posting is not open for applications");
  await findCandidateOrThrow(schoolId, input.candidateId);

  const existing = await prisma.candidateApplication.findUnique({
    where: { jobPostingId_candidateId: { jobPostingId: input.jobPostingId, candidateId: input.candidateId } },
  });
  if (existing) throw new ConflictError("This candidate has already applied to this job posting");

  return prisma.candidateApplication.create({
    data: { schoolId, jobPostingId: input.jobPostingId, candidateId: input.candidateId },
    include: APPLICATION_INCLUDE,
  });
}

export async function listApplications(
  schoolId: string,
  pagination: PaginationQuery,
  filters: { jobPostingId?: string; candidateId?: string; status?: CandidateApplicationStatus }
) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    ...(filters.jobPostingId ? { jobPostingId: filters.jobPostingId } : {}),
    ...(filters.candidateId ? { candidateId: filters.candidateId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.candidateApplication.findMany({
      where,
      include: APPLICATION_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.candidateApplication.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function getApplication(schoolId: string, id: string) {
  return findApplicationOrThrow(schoolId, id);
}

export async function updateApplicationStatus(schoolId: string, id: string, input: UpdateApplicationStatusInput) {
  const application = await findApplicationOrThrow(schoolId, id);
  assertTransition(application.status, input.status);
  return prisma.candidateApplication.update({
    where: { id },
    data: { status: input.status },
    include: APPLICATION_INCLUDE,
  });
}

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------

const SCHEDULABLE_STATUSES: CandidateApplicationStatus[] = ["SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEWED"];

export async function scheduleInterview(schoolId: string, input: ScheduleInterviewInput) {
  const application = await findApplicationOrThrow(schoolId, input.candidateApplicationId);
  if (!SCHEDULABLE_STATUSES.includes(application.status)) {
    throw new ConflictError(`Cannot schedule an interview for an application in status ${application.status}`);
  }

  const interviewer = await prisma.teacher.findFirst({ where: { id: input.interviewerId, schoolId, deletedAt: null } });
  if (!interviewer) throw new NotFoundError("Interviewer (teacher) not found");

  return prisma.$transaction(async (tx) => {
    if (application.status === "SHORTLISTED") {
      assertTransition(application.status, "INTERVIEW_SCHEDULED");
      await tx.candidateApplication.update({ where: { id: application.id }, data: { status: "INTERVIEW_SCHEDULED" } });
    }
    return tx.interview.create({
      data: {
        candidateApplicationId: input.candidateApplicationId,
        scheduledAt: input.scheduledAt,
        mode: input.mode,
        interviewerId: input.interviewerId,
      },
      include: { interviewer: true, feedback: true },
    });
  });
}

async function findInterviewOrThrow(schoolId: string, id: string) {
  const interview = await prisma.interview.findFirst({
    where: { id, candidateApplication: { schoolId } },
    include: { interviewer: true, feedback: true, candidateApplication: { include: APPLICATION_INCLUDE } },
  });
  if (!interview) throw new NotFoundError("Interview not found");
  return interview;
}

export async function listInterviews(schoolId: string, filters: { candidateApplicationId?: string }) {
  return prisma.interview.findMany({
    where: {
      candidateApplication: { schoolId },
      ...(filters.candidateApplicationId ? { candidateApplicationId: filters.candidateApplicationId } : {}),
    },
    include: { interviewer: true, feedback: true },
    orderBy: { scheduledAt: "desc" },
  });
}

export async function getInterview(schoolId: string, id: string) {
  return findInterviewOrThrow(schoolId, id);
}

export async function updateInterviewStatus(schoolId: string, id: string, input: UpdateInterviewStatusInput) {
  const interview = await findInterviewOrThrow(schoolId, id);
  if (interview.status !== "SCHEDULED") {
    throw new ConflictError("Only a scheduled interview can be cancelled or marked as no-show");
  }
  return prisma.interview.update({ where: { id }, data: { status: input.status } });
}

export async function submitInterviewFeedback(schoolId: string, interviewId: string, input: SubmitInterviewFeedbackInput) {
  const interview = await findInterviewOrThrow(schoolId, interviewId);
  if (interview.status !== "SCHEDULED") {
    throw new ConflictError("Feedback can only be submitted for a scheduled interview");
  }
  if (interview.feedback) {
    throw new ConflictError("Feedback has already been submitted for this interview");
  }

  return prisma.$transaction(async (tx) => {
    const feedback = await tx.interviewFeedback.create({
      data: {
        interviewId,
        rating: input.rating,
        recommendation: input.recommendation,
        comments: input.comments,
      },
    });
    await tx.interview.update({ where: { id: interviewId }, data: { status: "COMPLETED" } });
    return feedback;
  });
}

// ---------------------------------------------------------------------------
// Offer letters
// ---------------------------------------------------------------------------

export async function issueOfferLetter(
  schoolId: string,
  applicationId: string,
  issuedById: string,
  input: IssueOfferLetterInput
) {
  const application = await findApplicationOrThrow(schoolId, applicationId);
  assertTransition(application.status, "OFFERED");
  if (application.offerLetter) throw new ConflictError("An offer letter has already been issued for this application");

  const pdfBuffer = await renderPdfBuffer((doc) => {
    doc.fontSize(18).text("Offer Letter", { align: "center" });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Date: ${new Date().toDateString()}`);
    doc.moveDown();
    doc.text(`Dear ${application.candidate.fullName},`);
    doc.moveDown();
    doc.text(
      `We are pleased to offer you the position of ${input.position} in the ${application.jobPosting.department} department.`
    );
    doc.text(`Offered salary: ${input.salaryOffered.toFixed(2)}`);
    doc.text(`Joining date: ${input.joiningDate.toDateString()}`);
    doc.moveDown();
    doc.text("Please confirm your acceptance of this offer at your earliest convenience.");
  });
  const { filePath } = await storage.save(pdfBuffer, `offer-${application.id}.pdf`, `offer-letters/${application.id}`);

  return prisma.$transaction(async (tx) => {
    const offerLetter = await tx.offerLetter.create({
      data: {
        candidateApplicationId: applicationId,
        position: input.position,
        salaryOffered: input.salaryOffered,
        joiningDate: input.joiningDate,
        issuedById,
        filePath,
      },
    });
    await tx.candidateApplication.update({ where: { id: applicationId }, data: { status: "OFFERED" } });
    return offerLetter;
  });
}

export async function acceptOfferLetter(schoolId: string, applicationId: string) {
  const application = await findApplicationOrThrow(schoolId, applicationId);
  if (!application.offerLetter) throw new NotFoundError("No offer letter has been issued for this application");
  if (application.offerLetter.acceptedAt) throw new ConflictError("This offer letter has already been accepted");

  return prisma.offerLetter.update({
    where: { candidateApplicationId: applicationId },
    data: { acceptedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Hire -> StaffMember conversion
// ---------------------------------------------------------------------------

export async function convertToStaff(schoolId: string, applicationId: string) {
  const application = await findApplicationOrThrow(schoolId, applicationId);
  if (!application.offerLetter) {
    throw new ConflictError("An offer letter must be issued before a candidate can be converted to staff");
  }
  if (!application.offerLetter.acceptedAt) {
    throw new ConflictError("The candidate must accept the offer letter before conversion");
  }
  assertTransition(application.status, "HIRED");

  const existingUser = await prisma.user.findUnique({ where: { email: application.candidate.email } });
  if (existingUser) throw new BadRequestError("A user with this email already exists");

  const employeeCode = await generateStaffEmployeeCode(schoolId);
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await argon2.hash(temporaryPassword);

  const [firstName, ...rest] = application.candidate.fullName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  const staffMember = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        schoolId,
        email: application.candidate.email,
        passwordHash,
        fullName: application.candidate.fullName,
        phone: application.candidate.phone,
      },
    });

    const member = await tx.staffMember.create({
      data: {
        schoolId,
        userId: user.id,
        employeeCode,
        firstName,
        lastName,
        phone: application.candidate.phone,
        email: application.candidate.email,
        department: application.jobPosting.department,
        designation: application.offerLetter!.position,
        dateOfJoining: application.offerLetter!.joiningDate,
      },
    });

    await tx.candidateApplication.update({ where: { id: applicationId }, data: { status: "HIRED" } });

    return member;
  });

  return { staffMember, temporaryPassword };
}
