import { Router } from "express";
import { loginSchema, changePasswordSchema } from "@erp/shared";
import { validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import * as authController from "./auth.controller";

export const authRouter = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Access token + user issued, refresh token set as httpOnly cookie }
 *       401: { description: Invalid credentials }
 */
authRouter.post("/login", validateBody(loginSchema), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Rotate the refresh token and obtain a new access token
 *     tags: [Auth]
 *     responses:
 *       200: { description: New access token issued }
 *       401: { description: Refresh token missing, invalid, or expired }
 */
authRouter.post("/refresh", authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Revoke the current refresh token
 *     tags: [Auth]
 *     responses:
 *       204: { description: Logged out }
 */
authRouter.post("/logout", authController.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user profile with roles and permissions }
 */
authRouter.get("/me", requireAuth, authController.me);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change the authenticated user's password
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Password changed, all sessions revoked }
 */
authRouter.post(
  "/change-password",
  requireAuth,
  validateBody(changePasswordSchema),
  authController.changePassword
);
