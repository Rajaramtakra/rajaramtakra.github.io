import type { Request, Response } from "express";
import * as dashboardService from "./dashboard.service";
import { asyncHandler } from "../../middleware/asyncHandler";

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await dashboardService.getSummary(req.user!.schoolId);
  res.json({ summary });
});
