import { Router } from "express";
import * as controller from "./idCard.controller";

/**
 * @openapi
 * tags:
 *   name: ID Card Verification
 *   description: Public, unauthenticated QR verification for student ID cards
 */
export const idCardPublicRouter = Router();

idCardPublicRouter.get("/:code", controller.verifyByCode);
