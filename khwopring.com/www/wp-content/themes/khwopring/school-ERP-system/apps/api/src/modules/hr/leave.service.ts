import type { CreateLeaveRequestInput, DecideLeaveRequestInput, LeaveRequestSearchInput, Permission } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors";

const LEAVE_INCLUDE = {
  teacher: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
  staff: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
} as const;

interface Caller {
  id: string;
  permissions: Permission[];
}

const MANAGE_PERMISSIONS: Permission[] = ["staff:manage", "hr_recruitment:manage"];

function canManage(caller: Caller) {
  return MANAGE_PERMISSIONS.some((p) => caller.permissions.includes(p));
}

type OwnProfile = { kind: "teacher"; id: string } | { kind: "staff"; id: string };

/** Resolves the Teacher or StaffMember profile linked to a given user, if any. */
async function resolveOwnProfile(schoolId: string, userId: string): Promise<OwnProfile | null> {
  const teacher = await prisma.teacher.findFirst({ where: { userId, schoolId, deletedAt: null } });
  if (teacher) return { kind: "teacher", id: teacher.id };

  const staff = await prisma.staffMember.findFirst({ where: { userId, schoolId, deletedAt: null } });
  if (staff) return { kind: "staff", id: staff.id };

  return null;
}

async function findOrThrow(schoolId: string, id: string) {
  const leaveRequest = await prisma.leaveRequest.findFirst({ where: { id, schoolId }, include: LEAVE_INCLUDE });
  if (!leaveRequest) throw new NotFoundError("Leave request not found");
  return leaveRequest;
}

export async function createLeaveRequest(schoolId: string, caller: Caller, input: CreateLeaveRequestInput) {
  if (!canManage(caller)) {
    const own = await resolveOwnProfile(schoolId, caller.id);
    if (!own) throw new ForbiddenError("No teacher or staff profile is linked to your account");
    const ownTeacherId = own.kind === "teacher" ? own.id : null;
    const ownStaffId = own.kind === "staff" ? own.id : null;
    if (input.teacherId && input.teacherId !== ownTeacherId) {
      throw new ForbiddenError("You may only submit leave requests for yourself");
    }
    if (input.staffId && input.staffId !== ownStaffId) {
      throw new ForbiddenError("You may only submit leave requests for yourself");
    }
  }

  return prisma.leaveRequest.create({
    data: {
      schoolId,
      teacherId: input.teacherId,
      staffId: input.staffId,
      leaveType: input.leaveType,
      fromDate: input.fromDate,
      toDate: input.toDate,
      reason: input.reason,
    },
    include: LEAVE_INCLUDE,
  });
}

export async function listAllLeaveRequests(schoolId: string, filters: LeaveRequestSearchInput) {
  return prisma.leaveRequest.findMany({
    where: { schoolId, ...(filters.status ? { status: filters.status } : {}) },
    include: LEAVE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function listMyLeaveRequests(schoolId: string, userId: string) {
  const own = await resolveOwnProfile(schoolId, userId);
  if (!own) return [];

  return prisma.leaveRequest.findMany({
    where: {
      schoolId,
      ...(own.kind === "teacher" ? { teacherId: own.id } : { staffId: own.id }),
    },
    include: LEAVE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function decideLeaveRequest(
  schoolId: string,
  id: string,
  approvedById: string,
  input: DecideLeaveRequestInput
) {
  const leaveRequest = await findOrThrow(schoolId, id);
  if (leaveRequest.status !== "PENDING") {
    throw new ConflictError(`This leave request has already been ${leaveRequest.status.toLowerCase()}`);
  }

  return prisma.leaveRequest.update({
    where: { id },
    data: { status: input.decision, approvedById },
    include: LEAVE_INCLUDE,
  });
}
