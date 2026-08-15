import type { NextFunction, Request, Response } from "express";
import type { Permission } from "@erp/shared";
import { verifyAccessToken } from "../lib/tokens";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing access token"));
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      schoolId: payload.schoolId,
      roles: payload.roles,
      permissions: payload.permissions,
      email: "",
      fullName: "",
    };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}

/** Attaches req.user if a valid token is present, but never rejects the request. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.user = {
      id: payload.sub,
      schoolId: payload.schoolId,
      roles: payload.roles,
      permissions: payload.permissions,
      email: "",
      fullName: "",
    };
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

export function requirePermission(...anyOf: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    const hasPermission = anyOf.some((permission) => req.user!.permissions.includes(permission));
    if (!hasPermission) {
      return next(new ForbiddenError(`Missing required permission: ${anyOf.join(" or ")}`));
    }
    next();
  };
}
