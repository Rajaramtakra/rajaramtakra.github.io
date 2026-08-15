import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  deviceToken: { upsert: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { listMyDeviceTokens, registerDeviceToken, removeDeviceToken } from "../../src/modules/devices/device.service";

describe("device.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerDeviceToken", () => {
    it("upserts by unique token so re-registering the same device updates it", async () => {
      mockPrisma.deviceToken.upsert.mockResolvedValue({ id: "dt_1", token: "tok_abc", platform: "ANDROID" });

      const result = await registerDeviceToken("school_1", "user_1", { platform: "ANDROID", token: "tok_abc" });

      expect(result.id).toBe("dt_1");
      expect(mockPrisma.deviceToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token: "tok_abc" },
          create: { schoolId: "school_1", userId: "user_1", platform: "ANDROID", token: "tok_abc" },
          update: { schoolId: "school_1", userId: "user_1", platform: "ANDROID" },
        })
      );
    });
  });

  describe("listMyDeviceTokens", () => {
    it("scopes the query to the requesting user", async () => {
      mockPrisma.deviceToken.findMany.mockResolvedValue([{ id: "dt_1" }]);

      const result = await listMyDeviceTokens("user_1");

      expect(result).toHaveLength(1);
      expect(mockPrisma.deviceToken.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "user_1" } })
      );
    });
  });

  describe("removeDeviceToken", () => {
    it("rejects removing a token that does not belong to this user", async () => {
      mockPrisma.deviceToken.findFirst.mockResolvedValue(null);

      await expect(removeDeviceToken("user_1", "dt_1")).rejects.toThrow(/device token not found/i);
      expect(mockPrisma.deviceToken.delete).not.toHaveBeenCalled();
    });

    it("deletes a token owned by the user", async () => {
      mockPrisma.deviceToken.findFirst.mockResolvedValue({ id: "dt_1", userId: "user_1" });
      mockPrisma.deviceToken.delete.mockResolvedValue({ id: "dt_1" });

      await removeDeviceToken("user_1", "dt_1");

      expect(mockPrisma.deviceToken.delete).toHaveBeenCalledWith({ where: { id: "dt_1" } });
    });
  });
});
