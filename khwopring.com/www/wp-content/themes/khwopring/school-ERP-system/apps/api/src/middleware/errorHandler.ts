import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}`, code: "ROUTE_NOT_FOUND" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error({ err }, err.message);
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, details: err.details },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { message: "Validation failed", code: "VALIDATION_ERROR", details: err.flatten() },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: {
          message: `A record with this ${(err.meta?.target as string[])?.join(", ") ?? "value"} already exists`,
          code: "DUPLICATE_ENTRY",
        },
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: { message: "Record not found", code: "NOT_FOUND" } });
    }
    logger.error({ err }, "Prisma known request error");
    return res.status(400).json({ error: { message: "Database request error", code: "DB_ERROR" } });
  }

  logger.error({ err }, "Unhandled error");
  return res.status(500).json({
    error: { message: "Internal server error", code: "INTERNAL_ERROR" },
  });
}
