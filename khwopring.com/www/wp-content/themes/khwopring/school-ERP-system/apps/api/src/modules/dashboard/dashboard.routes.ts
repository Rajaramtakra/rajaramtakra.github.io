import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import * as controller from "./dashboard.controller";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     summary: Get role-visible dashboard counters and recent activity for the current school
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard summary }
 */
dashboardRouter.get("/summary", controller.getSummary);
