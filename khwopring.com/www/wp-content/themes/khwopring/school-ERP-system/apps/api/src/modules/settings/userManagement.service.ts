import type { AssignRoleInput, PaginationQuery, RevokeRoleInput } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { buildPaginationArgs, toPaginatedResult } from "../../lib/pagination";

// Identical include shape to auth.service.ts's loadAuthUser, reused so the roles/permissions
// payload returned here matches exactly what a user's JWT would carry after their next login.
const USER_ROLES_INCLUDE = {
  roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
} as const;

export async function listUsers(schoolId: string, pagination: PaginationQuery) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    deletedAt: null,
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
    prisma.user.findMany({
      where,
      include: USER_ROLES_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

/**
 * Assigns a role to a user. Idempotent: if the user already holds the role, the existing
 * UserRole row is returned rather than throwing a duplicate-key error (upsert on the
 * @@unique([userId, roleId]) constraint).
 *
 * Note: this does not invalidate the user's current JWT. Role/permission changes take effect
 * on the user's next login or token refresh, since access-token claims are computed once at
 * issuance time (see auth.service.ts's loadAuthUser/issueTokens) -- this is an existing,
 * intentional characteristic of the auth design, not something this module needs to solve.
 */
export async function assignRole(schoolId: string, input: AssignRoleInput) {
  const [user, role] = await Promise.all([
    prisma.user.findFirst({ where: { id: input.userId, schoolId, deletedAt: null } }),
    prisma.role.findFirst({ where: { id: input.roleId, OR: [{ schoolId }, { schoolId: null }] } }),
  ]);
  if (!user) throw new NotFoundError("User not found");
  if (!role) throw new NotFoundError("Role not found");

  return prisma.userRole.upsert({
    where: { userId_roleId: { userId: input.userId, roleId: input.roleId } },
    update: {},
    create: { userId: input.userId, roleId: input.roleId },
    include: { role: true },
  });
}

export async function revokeRole(schoolId: string, input: RevokeRoleInput) {
  const user = await prisma.user.findFirst({ where: { id: input.userId, schoolId, deletedAt: null } });
  if (!user) throw new NotFoundError("User not found");

  await prisma.userRole.deleteMany({ where: { userId: input.userId, roleId: input.roleId } });
}

export async function listRoles(schoolId: string) {
  return prisma.role.findMany({
    where: { OR: [{ schoolId }, { schoolId: null }] },
    include: { permissions: { include: { permission: true } } },
    orderBy: { name: "asc" },
  });
}
