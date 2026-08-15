import { Router } from "express";
import { collectSalePaymentSchema, createSaleSchema } from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./pos.controller";

export const posRouter = Router();
posRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Point of Sale
 *   description: School store checkout — sales, payments, and cancellations against InventoryItem stock
 */

posRouter.post("/sales", requirePermission("pos:manage"), validateBody(createSaleSchema), controller.createSale);
posRouter.get("/sales", requirePermission("pos:manage", "pos:read"), controller.listSales);
posRouter.get("/sales/:id", requirePermission("pos:manage", "pos:read"), controller.getSale);
posRouter.post("/sales/:id/cancel", requirePermission("pos:manage"), controller.cancelSale);

posRouter.get("/sales/:id/payments", requirePermission("pos:manage", "pos:read"), controller.listPayments);
posRouter.post(
  "/sales/:id/payments",
  requirePermission("pos:manage"),
  validateBody(collectSalePaymentSchema),
  controller.collectPayment
);
