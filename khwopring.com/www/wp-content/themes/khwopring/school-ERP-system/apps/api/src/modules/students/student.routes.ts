import { Router } from "express";
import {
  addGuardianSchema,
  alumniConvertSchema,
  emergencyContactSchema,
  promoteStudentsSchema,
  reinstateStudentSchema,
  rusticateStudentSchema,
  suspendStudentSchema,
  transferCertificateSchema,
  updateStudentProfileSchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { upload } from "../../middleware/upload.middleware";
import * as controller from "./student.controller";
import * as idCardController from "../id-cards/idCard.controller";

export const studentRouter = Router();
studentRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Students
 *   description: Student profiles, guardians, promotion, suspension, TC, alumni
 */

studentRouter.get("/", requirePermission("student:read", "student:read_own"), controller.searchStudents);

studentRouter.get(
  "/me/id-card",
  requirePermission("student:read_own", "student:id_card_read_own"),
  idCardController.getMyCard
);

studentRouter.get(
  "/me/id-card/pdf",
  requirePermission("student:read_own", "student:id_card_read_own"),
  idCardController.downloadMyCardPdf
);

studentRouter.post(
  "/id-cards/bulk-pdf",
  requirePermission("student:id_card_manage"),
  idCardController.bulkDownloadCardsPdf
);

studentRouter.post(
  "/promote",
  requirePermission("student:promote"),
  validateBody(promoteStudentsSchema),
  controller.promoteStudents
);

studentRouter.get("/:id", requirePermission("student:read", "student:read_own"), controller.getStudent);

studentRouter.patch(
  "/:id",
  requirePermission("student:update"),
  validateBody(updateStudentProfileSchema),
  controller.updateProfile
);

studentRouter.post(
  "/:id/photo",
  requirePermission("student:update"),
  upload.single("file"),
  controller.uploadPhoto
);

studentRouter.post(
  "/:id/guardians",
  requirePermission("guardian:manage"),
  validateBody(addGuardianSchema),
  controller.addGuardian
);

studentRouter.post(
  "/:id/emergency-contacts",
  requirePermission("student:update"),
  validateBody(emergencyContactSchema),
  controller.addEmergencyContact
);

studentRouter.post(
  "/:id/suspend",
  requirePermission("student:suspend"),
  validateBody(suspendStudentSchema),
  controller.suspendStudent
);

studentRouter.post(
  "/:id/reinstate",
  requirePermission("student:suspend"),
  validateBody(reinstateStudentSchema),
  controller.reinstateStudent
);

studentRouter.post(
  "/:id/rusticate",
  requirePermission("student:suspend"),
  validateBody(rusticateStudentSchema),
  controller.rusticateStudent
);

studentRouter.post(
  "/:id/transfer-certificate",
  requirePermission("student:transfer"),
  validateBody(transferCertificateSchema),
  controller.issueTransferCertificate
);

studentRouter.post(
  "/:id/alumni-convert",
  requirePermission("student:alumni_convert"),
  validateBody(alumniConvertSchema),
  controller.convertToAlumni
);

studentRouter.post("/:id/portal-access", requirePermission("student:update"), controller.enablePortalAccess);

studentRouter.get(
  "/:id/id-card",
  requirePermission("student:read", "student:read_own"),
  idCardController.getCardData
);

studentRouter.get(
  "/:id/id-card/pdf",
  requirePermission("student:read", "student:read_own"),
  idCardController.downloadCardPdf
);

studentRouter.get(
  "/:id/id-card/qr.png",
  requirePermission("student:read", "student:read_own"),
  idCardController.getCardQrPng
);

studentRouter.post(
  "/:id/id-card/regenerate",
  requirePermission("student:id_card_manage"),
  idCardController.regenerateCard
);
