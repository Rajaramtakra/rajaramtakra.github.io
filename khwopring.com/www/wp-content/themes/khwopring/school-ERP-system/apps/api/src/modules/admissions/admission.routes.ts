import { Router } from "express";
import {
  createAdmissionApplicationSchema,
  decideAdmissionSchema,
  enrollAdmissionSchema,
  reviewAdmissionSchema,
  updateAdmissionApplicationSchema,
  uploadAdmissionDocumentSchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { upload } from "../../middleware/upload.middleware";
import * as controller from "./admission.controller";

export const admissionRouter = Router();
admissionRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Admissions
 *   description: Draft -> Submitted -> Review -> Approved/Rejected -> Enrolled workflow
 */

admissionRouter.post(
  "/",
  requirePermission("admission:create"),
  validateBody(createAdmissionApplicationSchema),
  controller.createDraft
);

admissionRouter.get("/", requirePermission("admission:read"), controller.listApplications);

admissionRouter.get("/:id", requirePermission("admission:read"), controller.getApplication);

admissionRouter.patch(
  "/:id",
  requirePermission("admission:update"),
  validateBody(updateAdmissionApplicationSchema),
  controller.updateDraft
);

admissionRouter.post("/:id/submit", requirePermission("admission:update"), controller.submit);

admissionRouter.post(
  "/:id/review",
  requirePermission("admission:review"),
  validateBody(reviewAdmissionSchema),
  controller.moveToReview
);

admissionRouter.post(
  "/:id/decide",
  requirePermission("admission:approve"),
  validateBody(decideAdmissionSchema),
  controller.decide
);

admissionRouter.post(
  "/:id/enroll",
  requirePermission("admission:enroll"),
  validateBody(enrollAdmissionSchema),
  controller.enroll
);

admissionRouter.post(
  "/:id/documents",
  requirePermission("admission:update"),
  upload.single("file"),
  validateBody(uploadAdmissionDocumentSchema),
  controller.uploadDocument
);
