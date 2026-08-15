import type { Request, Response } from "express";
import * as deviceService from "./device.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const registerDeviceToken = asyncHandler(async (req: Request, res: Response) => {
  const deviceToken = await deviceService.registerDeviceToken(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "REGISTER", resource: "device_token", resourceId: deviceToken.id });
  res.status(201).json({ deviceToken });
});

export const listMyDeviceTokens = asyncHandler(async (req: Request, res: Response) => {
  const deviceTokens = await deviceService.listMyDeviceTokens(req.user!.id);
  res.json({ deviceTokens });
});

export const removeDeviceToken = asyncHandler(async (req: Request, res: Response) => {
  await deviceService.removeDeviceToken(req.user!.id, req.params.id);
  await recordAudit({ req, action: "DELETE", resource: "device_token", resourceId: req.params.id });
  res.status(204).send();
});
