import type {
  CreateAdmissionApplicationInput,
  DecideAdmissionInput,
  EnrollAdmissionInput,
  PaginationQuery,
  ReviewAdmissionInput,
  UpdateAdmissionApplicationInput,
} from "@erp/shared";
import type { AdmissionStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors";
import { buildPaginationArgs, toPaginatedResult } from "../../lib/pagination";
import { generateApplicationNumber, generateRegistrationNumber } from "./admission.numbering";
import { storage } from "../../lib/storage";

const ALLOWED_TRANSITIONS: Record<AdmissionStatus, AdmissionStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["REVIEW"],
  REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["ENROLLED"],
  REJECTED: [],
  ENROLLED: [],
};

function assertTransition(current: AdmissionStatus, next: AdmissionStatus) {
  if (!ALLOWED_TRANSITIONS[current].includes(next)) {
    throw new ConflictError(`Cannot move application from ${current} to ${next}`);
  }
}

export async function createDraft(schoolId: string, createdById: string, input: CreateAdmissionApplicationInput) {
  const applicationNumber = await generateApplicationNumber(schoolId);

  return prisma.admissionApplication.create({
    data: {
      schoolId,
      applicationNumber,
      studentFirstName: input.studentFirstName,
      studentLastName: input.studentLastName,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      bloodGroup: input.bloodGroup,
      nationality: input.nationality,
      address: input.address,
      previousSchool: input.previousSchool,
      classAppliedForId: input.classAppliedForId,
      academicSessionId: input.academicSessionId,
      isRte: input.isRte,
      rteCategory: input.rteCategory,
      createdById,
      status: "DRAFT",
      guardians: {
        create: input.guardians.map((g) => ({
          fullName: g.fullName,
          relation: g.relation,
          phone: g.phone,
          email: g.email,
          occupation: g.occupation,
          isPrimary: g.isPrimary,
        })),
      },
    },
    include: { guardians: true },
  });
}

async function findOrThrow(schoolId: string, id: string) {
  const application = await prisma.admissionApplication.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: { guardians: true, documents: true, classAppliedFor: true, academicSession: true },
  });
  if (!application) throw new NotFoundError("Admission application not found");
  return application;
}

export async function getApplication(schoolId: string, id: string) {
  return findOrThrow(schoolId, id);
}

export async function updateDraft(schoolId: string, id: string, input: UpdateAdmissionApplicationInput) {
  const application = await findOrThrow(schoolId, id);
  if (application.status !== "DRAFT") {
    throw new ConflictError("Only DRAFT applications can be edited directly");
  }

  const { guardians, ...rest } = input;

  return prisma.$transaction(async (tx) => {
    if (guardians) {
      await tx.admissionGuardian.deleteMany({ where: { admissionApplicationId: id } });
    }
    return tx.admissionApplication.update({
      where: { id },
      data: {
        ...rest,
        ...(guardians
          ? {
              guardians: {
                create: guardians.map((g) => ({
                  fullName: g.fullName,
                  relation: g.relation,
                  phone: g.phone,
                  email: g.email,
                  occupation: g.occupation,
                  isPrimary: g.isPrimary,
                })),
              },
            }
          : {}),
      },
      include: { guardians: true },
    });
  });
}

export async function listApplications(
  schoolId: string,
  pagination: PaginationQuery,
  filters: { status?: AdmissionStatus }
) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    deletedAt: null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(pagination.search
      ? {
          OR: [
            { studentFirstName: { contains: pagination.search, mode: "insensitive" as const } },
            { studentLastName: { contains: pagination.search, mode: "insensitive" as const } },
            { applicationNumber: { contains: pagination.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.admissionApplication.findMany({
      where,
      include: { classAppliedFor: true, academicSession: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.admissionApplication.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function submit(schoolId: string, id: string) {
  const application = await findOrThrow(schoolId, id);
  assertTransition(application.status, "SUBMITTED");
  if (application.guardians.length === 0) {
    throw new BadRequestError("At least one guardian is required before submission");
  }
  return prisma.admissionApplication.update({
    where: { id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
}

export async function moveToReview(schoolId: string, id: string, input: ReviewAdmissionInput) {
  const application = await findOrThrow(schoolId, id);
  assertTransition(application.status, "REVIEW");
  return prisma.admissionApplication.update({
    where: { id },
    data: { status: "REVIEW", reviewNotes: input.notes },
  });
}

export async function decide(schoolId: string, id: string, decidedById: string, input: DecideAdmissionInput) {
  const application = await findOrThrow(schoolId, id);
  assertTransition(application.status, input.decision);
  return prisma.admissionApplication.update({
    where: { id },
    data: {
      status: input.decision,
      decisionNotes: input.notes,
      decidedById,
      decidedAt: new Date(),
    },
  });
}

export async function enroll(schoolId: string, id: string, input: EnrollAdmissionInput) {
  const application = await findOrThrow(schoolId, id);
  assertTransition(application.status, "ENROLLED");

  const section = await prisma.section.findFirst({ where: { id: input.sectionId, schoolId, deletedAt: null } });
  if (!section) throw new NotFoundError("Target section not found");

  const school = await prisma.school.findUniqueOrThrow({ where: { id: schoolId } });
  const registrationNumber = await generateRegistrationNumber(schoolId, school.code);

  const latestPhoto = application.documents
    .filter((d) => d.category === "PHOTO")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        schoolId,
        registrationNumber,
        admissionApplicationId: application.id,
        firstName: application.studentFirstName,
        lastName: application.studentLastName,
        dateOfBirth: application.dateOfBirth,
        gender: application.gender,
        bloodGroup: application.bloodGroup,
        nationality: application.nationality,
        address: application.address,
        sectionId: input.sectionId,
        academicSessionId: application.academicSessionId,
        status: "ACTIVE",
        photoUrl: latestPhoto?.filePath,
        idCardQrCode: randomUUID(),
        idCardIssuedAt: new Date(),
      },
    });

    for (const g of application.guardians) {
      let guardian = await tx.guardian.findFirst({ where: { schoolId, phone: g.phone } });
      if (!guardian) {
        guardian = await tx.guardian.create({
          data: { schoolId, fullName: g.fullName, phone: g.phone, email: g.email, occupation: g.occupation },
        });
      }
      await tx.studentGuardian.create({
        data: { studentId: student.id, guardianId: guardian.id, relation: g.relation, isPrimary: g.isPrimary },
      });
    }

    await tx.admissionApplication.update({ where: { id: application.id }, data: { status: "ENROLLED" } });

    return student;
  });
}

export async function uploadDocument(
  schoolId: string,
  applicationId: string,
  uploadedById: string,
  category: string,
  file: Express.Multer.File
) {
  await findOrThrow(schoolId, applicationId);
  const { filePath, fileName } = await storage.save(file.buffer, file.originalname, `admissions/${applicationId}`);

  return prisma.admissionDocument.create({
    data: {
      admissionApplicationId: applicationId,
      category: category as never,
      fileName,
      filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedById,
    },
  });
}
