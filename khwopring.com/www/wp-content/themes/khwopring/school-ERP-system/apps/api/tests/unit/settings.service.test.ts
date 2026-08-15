import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  role: { findFirst: vi.fn(), findMany: vi.fn() },
  userRole: { upsert: vi.fn(), deleteMany: vi.fn() },
  school: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  assignRole,
  listRoles,
  listUsers,
  revokeRole,
} from "../../src/modules/settings/userManagement.service";

describe("settings.service (userManagement)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assigns a role to a user by upserting the UserRole row keyed by userId+roleId", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user_1", schoolId: "school_1" });
    mockPrisma.role.findFirst.mockResolvedValue({ id: "role_1" });
    mockPrisma.userRole.upsert.mockResolvedValue({ id: "ur_1", userId: "user_1", roleId: "role_1" });

    const result = await assignRole("school_1", { userId: "user_1", roleId: "role_1" });

    expect(mockPrisma.userRole.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_roleId: { userId: "user_1", roleId: "role_1" } },
        create: { userId: "user_1", roleId: "role_1" },
        update: {},
      })
    );
    expect(result).toEqual({ id: "ur_1", userId: "user_1", roleId: "role_1" });
  });

  it("no-ops gracefully when the user already holds the role (upsert absorbs the duplicate)", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user_1", schoolId: "school_1" });
    mockPrisma.role.findFirst.mockResolvedValue({ id: "role_1" });
    mockPrisma.userRole.upsert.mockResolvedValue({ id: "ur_existing", userId: "user_1", roleId: "role_1" });

    await assignRole("school_1", { userId: "user_1", roleId: "role_1" });

    // upsert (not create) means a pre-existing UserRole row is left untouched rather than erroring
    expect(mockPrisma.userRole.upsert).toHaveBeenCalledTimes(1);
  });

  it("throws NotFoundError when assigning a role to a user outside the caller's school", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.role.findFirst.mockResolvedValue({ id: "role_1" });

    await expect(assignRole("school_1", { userId: "ghost_user", roleId: "role_1" })).rejects.toThrow(/user not found/i);
    expect(mockPrisma.userRole.upsert).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when assigning a role that doesn't belong to the school (or a system role)", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user_1", schoolId: "school_1" });
    mockPrisma.role.findFirst.mockResolvedValue(null);

    await expect(assignRole("school_1", { userId: "user_1", roleId: "ghost_role" })).rejects.toThrow(/role not found/i);
    expect(mockPrisma.userRole.upsert).not.toHaveBeenCalled();
  });

  it("revokes a role by deleting the UserRole row for that userId+roleId pair", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user_1", schoolId: "school_1" });
    mockPrisma.userRole.deleteMany.mockResolvedValue({ count: 1 });

    await revokeRole("school_1", { userId: "user_1", roleId: "role_1" });

    expect(mockPrisma.userRole.deleteMany).toHaveBeenCalledWith({ where: { userId: "user_1", roleId: "role_1" } });
  });

  it("revoking a role the user never had is a graceful no-op (deleteMany matches zero rows)", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user_1", schoolId: "school_1" });
    mockPrisma.userRole.deleteMany.mockResolvedValue({ count: 0 });

    await expect(revokeRole("school_1", { userId: "user_1", roleId: "role_never_held" })).resolves.not.toThrow();
  });

  it("scopes listUsers to the caller's school and includes the auth.service-identical roles/permissions shape", async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);

    await listUsers("school_1", { page: 1, pageSize: 20 });

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: "school_1" }),
        include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
      })
    );
  });

  it("lists roles visible to the school, including global system roles (schoolId null)", async () => {
    mockPrisma.role.findMany.mockResolvedValue([]);

    await listRoles("school_1");

    expect(mockPrisma.role.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ schoolId: "school_1" }, { schoolId: null }] },
      })
    );
  });
});
