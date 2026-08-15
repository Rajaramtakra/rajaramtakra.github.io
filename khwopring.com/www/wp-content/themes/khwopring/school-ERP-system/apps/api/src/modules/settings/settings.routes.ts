import { Router } from "express";
import { createHolidaySchema, updateSchoolProfileSchema } from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { upload } from "../../middleware/upload.middleware";
import * as controller from "./settings.controller";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Settings
 *   description: School profile, user role assignment, and read-only role/permission listings
 */

settingsRouter.get("/school", requirePermission("settings:manage"), controller.getSchoolProfile);

settingsRouter.patch(
  "/school",
  requirePermission("settings:manage"),
  upload.single("logo"),
  validateBody(updateSchoolProfileSchema),
  controller.updateSchoolProfile
);

settingsRouter.get("/users", requirePermission("settings:manage", "user:manage"), controller.listUsers);

settingsRouter.post(
  "/users/:id/roles",
  requirePermission("settings:manage", "role:manage"),
  controller.assignRole
);

settingsRouter.delete(
  "/users/:id/roles/:roleId",
  requirePermission("settings:manage", "role:manage"),
  controller.revokeRole
);

settingsRouter.get("/roles", requirePermission("settings:manage", "role:manage"), controller.listRoles);

settingsRouter.get("/holidays", requirePermission("settings:manage"), controller.listHolidays);
settingsRouter.post(
  "/holidays",
  requirePermission("settings:manage"),
  validateBody(createHolidaySchema),
  controller.createHoliday
);
settingsRouter.delete("/holidays/:id", requirePermission("settings:manage"), controller.deleteHoliday);
