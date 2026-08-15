import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLE_PERMISSIONS, ROLE_NAMES } from "@erp/shared";

describe("RBAC permission matrix integrity", () => {
  const validPermissions = new Set<string>(PERMISSIONS);

  it("defines a permission list for every one of the 11 roles", () => {
    for (const role of ROLE_NAMES) {
      expect(ROLE_PERMISSIONS[role], `missing permissions for ${role}`).toBeDefined();
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });

  it("only references permission keys that exist in the master PERMISSIONS list", () => {
    for (const role of ROLE_NAMES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(validPermissions.has(permission), `${role} references unknown permission "${permission}"`).toBe(true);
      }
    }
  });

  it("grants SUPER_ADMIN every permission", () => {
    expect(new Set(ROLE_PERMISSIONS.SUPER_ADMIN)).toEqual(validPermissions);
  });

  it("does not grant STUDENT or PARENT any *:manage write permission", () => {
    for (const role of ["STUDENT", "PARENT"] as const) {
      const hasManage = ROLE_PERMISSIONS[role].some((p) => p.endsWith(":manage"));
      expect(hasManage, `${role} should not hold a :manage permission`).toBe(false);
    }
  });
});
