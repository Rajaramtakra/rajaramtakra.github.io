import { Router } from "express";
import { registerDeviceTokenSchema } from "@erp/shared";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./device.controller";

export const deviceRouter = Router();
deviceRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Devices
 *   description: Mobile app device token registration for push notifications
 */

deviceRouter.post("/", validateBody(registerDeviceTokenSchema), controller.registerDeviceToken);
deviceRouter.get("/", controller.listMyDeviceTokens);
deviceRouter.delete("/:id", controller.removeDeviceToken);
