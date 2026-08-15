import type { Request, Response } from "express";
import * as idCardService from "./idCard.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";
import { BadRequestError } from "../../lib/errors";

function parseSide(value: unknown): "front" | "back" | "both" {
  if (value === "front" || value === "back" || value === "both") return value;
  return "both";
}

function requester(req: Request) {
  return { userId: req.user!.id, permissions: req.user!.permissions };
}

export const getCardData = asyncHandler(async (req: Request, res: Response) => {
  const card = await idCardService.assembleCardDataForRequester(req.user!.schoolId, req.params.id, requester(req));
  res.json({ card });
});

export const downloadCardPdf = asyncHandler(async (req: Request, res: Response) => {
  const side = parseSide(req.query.side);
  const buffer = await idCardService.generateCardPdfForRequester(
    req.user!.schoolId,
    req.params.id,
    side,
    requester(req)
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="id-card-${req.params.id}-${side}.pdf"`);
  res.send(buffer);
});

export const getCardQrPng = asyncHandler(async (req: Request, res: Response) => {
  const buffer = await idCardService.generateQrPngForRequester(req.user!.schoolId, req.params.id, requester(req));
  res.setHeader("Content-Type", "image/png");
  res.send(buffer);
});

export const regenerateCard = asyncHandler(async (req: Request, res: Response) => {
  const student = await idCardService.regenerateCard(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "REGENERATE_ID_CARD", resource: "student", resourceId: student.id });
  res.json({ student });
});

export const getMyCard = asyncHandler(async (req: Request, res: Response) => {
  const card = await idCardService.assembleMyCardData(req.user!.schoolId, req.user!.id);
  res.json({ card });
});

export const downloadMyCardPdf = asyncHandler(async (req: Request, res: Response) => {
  const side = parseSide(req.query.side);
  const card = await idCardService.assembleMyCardData(req.user!.schoolId, req.user!.id);
  const buffer = await idCardService.generateCardPdf(req.user!.schoolId, card.id, side);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="my-id-card-${side}.pdf"`);
  res.send(buffer);
});

export const bulkDownloadCardsPdf = asyncHandler(async (req: Request, res: Response) => {
  const studentIds = req.body?.studentIds;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new BadRequestError("studentIds must be a non-empty array");
  }
  const buffer = await idCardService.bulkGenerateCardsPdf(req.user!.schoolId, studentIds);
  await recordAudit({ req, action: "BULK_PRINT_ID_CARDS", resource: "student", metadata: { count: studentIds.length } });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="id-cards-bulk.pdf"`);
  res.send(buffer);
});

export const verifyByCode = asyncHandler(async (req: Request, res: Response) => {
  const result = await idCardService.verifyByQrCode(req.params.code);
  res.json({ verification: result });
});
