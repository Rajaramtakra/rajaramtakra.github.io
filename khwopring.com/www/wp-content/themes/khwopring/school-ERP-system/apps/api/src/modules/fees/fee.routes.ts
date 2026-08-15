import { Router } from "express";
import {
  createDiscountSchema,
  createFeeCategorySchema,
  createFeeStructureSchema,
  createFineSchema,
  createScholarshipSchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./fee.controller";

export const feeRouter = Router();
feeRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Fees
 *   description: Fee categories, structures, discounts, scholarships, and fines
 */

feeRouter.get("/categories", controller.listFeeCategories);
feeRouter.post(
  "/categories",
  requirePermission("fee:manage"),
  validateBody(createFeeCategorySchema),
  controller.createFeeCategory
);

feeRouter.get("/structures", controller.listFeeStructures);
feeRouter.post(
  "/structures",
  requirePermission("fee:manage"),
  validateBody(createFeeStructureSchema),
  controller.createFeeStructure
);

feeRouter.get("/discounts", controller.listDiscounts);
feeRouter.post(
  "/discounts",
  requirePermission("discount:approve"),
  validateBody(createDiscountSchema),
  controller.createDiscount
);

feeRouter.get("/scholarships", controller.listScholarships);
feeRouter.post(
  "/scholarships",
  requirePermission("discount:approve"),
  validateBody(createScholarshipSchema),
  controller.createScholarship
);

feeRouter.get("/fines", controller.listFines);
feeRouter.post("/fines", requirePermission("fee:manage"), validateBody(createFineSchema), controller.createFine);
feeRouter.post("/fines/:id/waive", requirePermission("fee:manage"), controller.waiveFine);
feeRouter.post("/fines/:id/mark-paid", requirePermission("fee:manage"), controller.markFinePaid);
