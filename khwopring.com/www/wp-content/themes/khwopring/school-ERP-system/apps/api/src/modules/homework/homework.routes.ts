import { Router } from "express";
import { createHomeworkSchema, updateHomeworkSchema } from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { upload } from "../../middleware/upload.middleware";
import * as controller from "./homework.controller";

export const homeworkRouter = Router();
homeworkRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Homework
 *   description: Homework assignments per section/subject, with optional attachment
 */

homeworkRouter.get("/", requirePermission("homework:read", "homework:manage"), controller.listHomework);

homeworkRouter.get("/:id", requirePermission("homework:read", "homework:manage"), controller.getHomework);

homeworkRouter.post(
  "/",
  requirePermission("homework:manage"),
  upload.single("file"),
  validateBody(createHomeworkSchema),
  controller.createHomework
);

homeworkRouter.patch(
  "/:id",
  requirePermission("homework:manage"),
  upload.single("file"),
  validateBody(updateHomeworkSchema),
  controller.updateHomework
);

homeworkRouter.delete("/:id", requirePermission("homework:manage"), controller.deleteHomework);
