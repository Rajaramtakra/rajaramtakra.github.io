import type {
  ConvertEnquiryInput,
  CreateEnquiryInput,
  CreatePtmMeetingInput,
  CreateStudentRequestInput,
  ListEnquiriesQuery,
  ListStudentRequestsQuery,
  RecordPtmAttendanceInput,
  UpdateEnquiryInput,
  UpdateStudentRequestInput,
} from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors";
import * as admissionService from "../admissions/admission.service";

// -------------------------------------------------------------------------
// Enquiries
// -------------------------------------------------------------------------

async function findEnquiryOrThrow(schoolId: string, id: string) {
  const enquiry = await prisma.enquiry.findFirst({ where: { id, schoolId } });
  if (!enquiry) throw new NotFoundError("Enquiry not found");
  return enquiry;
}

export async function createEnquiry(schoolId: string, createdById: string, input: CreateEnquiryInput) {
  return prisma.enquiry.create({
    data: { schoolId, createdById, ...input },
    include: { interestedClass: true },
  });
}

export async function listEnquiries(schoolId: string, filters: ListEnquiriesQuery) {
  return prisma.enquiry.findMany({
    where: { schoolId, ...(filters.status ? { status: filters.status } : {}) },
    include: { interestedClass: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEnquiry(schoolId: string, id: string) {
  const enquiry = await prisma.enquiry.findFirst({
    where: { id, schoolId },
    include: { interestedClass: true, convertedAdmissionApplication: true },
  });
  if (!enquiry) throw new NotFoundError("Enquiry not found");
  return enquiry;
}

export async function updateEnquiry(schoolId: string, id: string, input: UpdateEnquiryInput) {
  await findEnquiryOrThrow(schoolId, id);
  return prisma.enquiry.update({ where: { id }, data: input });
}

export async function convertEnquiry(
  schoolId: string,
  id: string,
  createdById: string,
  input: ConvertEnquiryInput
) {
  const enquiry = await findEnquiryOrThrow(schoolId, id);
  if (enquiry.status === "CONVERTED") {
    throw new ConflictError("This enquiry has already been converted to an admission application");
  }

  const application = await admissionService.createDraft(schoolId, createdById, input);

  const updatedEnquiry = await prisma.enquiry.update({
    where: { id },
    data: { status: "CONVERTED", convertedAdmissionApplicationId: application.id },
  });

  return { enquiry: updatedEnquiry, application };
}

// -------------------------------------------------------------------------
// Siblings (derived from the existing StudentGuardian join, no dedicated model)
// -------------------------------------------------------------------------

export async function getSiblings(schoolId: string, studentId: string) {
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } });
  if (!student) throw new NotFoundError("Student not found");

  const guardianLinks = await prisma.studentGuardian.findMany({ where: { studentId } });
  const guardianIds = guardianLinks.map((g) => g.guardianId);
  if (guardianIds.length === 0) return [];

  const siblingLinks = await prisma.studentGuardian.findMany({
    where: { guardianId: { in: guardianIds }, studentId: { not: studentId } },
    include: { student: { include: { section: { include: { class: true } } } } },
  });

  const seen = new Map<string, (typeof siblingLinks)[number]["student"]>();
  for (const link of siblingLinks) {
    if (link.student.schoolId === schoolId && !link.student.deletedAt) {
      seen.set(link.student.id, link.student);
    }
  }
  return Array.from(seen.values());
}

// -------------------------------------------------------------------------
// Student Requests
// -------------------------------------------------------------------------

export async function createStudentRequest(schoolId: string, input: CreateStudentRequestInput) {
  const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId, deletedAt: null } });
  if (!student) throw new BadRequestError("Student not found in this school");

  return prisma.studentRequest.create({ data: { schoolId, ...input } });
}

export async function listStudentRequests(schoolId: string, filters: ListStudentRequestsQuery) {
  return prisma.studentRequest.findMany({
    where: {
      schoolId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
    },
    include: { student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateStudentRequestStatus(
  schoolId: string,
  id: string,
  resolvedById: string,
  input: UpdateStudentRequestInput
) {
  const request = await prisma.studentRequest.findFirst({ where: { id, schoolId } });
  if (!request) throw new NotFoundError("Student request not found");

  const isClosing = input.status === "RESOLVED" || input.status === "CLOSED";
  return prisma.studentRequest.update({
    where: { id },
    data: {
      status: input.status,
      resolvedAt: isClosing ? new Date() : null,
      resolvedById: isClosing ? resolvedById : null,
    },
  });
}

// -------------------------------------------------------------------------
// PTM Meetings
// -------------------------------------------------------------------------

export async function createPtmMeeting(schoolId: string, createdById: string, input: CreatePtmMeetingInput) {
  const { studentIds, ...rest } = input;
  return prisma.pTMMeeting.create({
    data: {
      schoolId,
      createdById,
      ...rest,
      attendances: { create: studentIds.map((studentId) => ({ studentId })) },
    },
    include: { attendances: true },
  });
}

export async function listPtmMeetings(schoolId: string, filters: { sectionId?: string }) {
  return prisma.pTMMeeting.findMany({
    where: { schoolId, ...(filters.sectionId ? { sectionId: filters.sectionId } : {}) },
    include: { section: { include: { class: true } }, _count: { select: { attendances: true } } },
    orderBy: { scheduledAt: "desc" },
  });
}

export async function getPtmMeeting(schoolId: string, id: string) {
  const meeting = await prisma.pTMMeeting.findFirst({
    where: { id, schoolId },
    include: {
      section: { include: { class: true } },
      attendances: { include: { student: true, guardian: true } },
    },
  });
  if (!meeting) throw new NotFoundError("PTM meeting not found");
  return meeting;
}

export async function recordPtmAttendance(schoolId: string, meetingId: string, input: RecordPtmAttendanceInput) {
  const meeting = await prisma.pTMMeeting.findFirst({ where: { id: meetingId, schoolId } });
  if (!meeting) throw new NotFoundError("PTM meeting not found");

  return prisma.$transaction(
    input.attendances.map((a) =>
      prisma.pTMAttendance.upsert({
        where: { ptmMeetingId_studentId: { ptmMeetingId: meetingId, studentId: a.studentId } },
        create: { ptmMeetingId: meetingId, studentId: a.studentId, guardianId: a.guardianId, attended: a.attended, remarks: a.remarks },
        update: { guardianId: a.guardianId, attended: a.attended, remarks: a.remarks },
      })
    )
  );
}
