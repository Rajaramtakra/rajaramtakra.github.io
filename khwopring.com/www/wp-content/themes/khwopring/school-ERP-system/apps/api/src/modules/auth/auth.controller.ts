import type { Request, Response } from "express";
import * as authService from "./auth.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";
import { UnauthorizedError } from "../../lib/errors";
import { env } from "../../config/env";
import { refreshExpiryMs } from "../../lib/tokens";

const REFRESH_COOKIE = "refreshToken";
/** Non-sensitive marker so `/refresh` can tell, on later requests, whether the original login chose to persist the session. */
const REMEMBER_COOKIE = "rememberMe";

/** `rememberMe` makes the cookie survive browser restarts; otherwise it's a session cookie cleared on browser close. */
function cookieOptions(rememberMe?: boolean) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth",
    ...(rememberMe ? { maxAge: refreshExpiryMs() } : {}),
  };
}

function setSessionCookies(res: Response, refreshToken: string, rememberMe?: boolean) {
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(rememberMe));
  if (rememberMe) {
    res.cookie(REMEMBER_COOKIE, "1", { ...cookieOptions(true), httpOnly: false });
  } else {
    res.clearCookie(REMEMBER_COOKIE, { path: "/api/auth" });
  }
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;
  const { accessToken, refreshToken, user } = await authService.login(email, password, req.ip);

  setSessionCookies(res, refreshToken, rememberMe);
  req.user = user;
  await recordAudit({ req, action: "LOGIN", resource: "auth", resourceId: user.id });
  res.json({ accessToken, user });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
  if (!token) throw new UnauthorizedError("Missing refresh token");

  const { accessToken, refreshToken, user } = await authService.refreshSession(token, req.ip);
  const rememberMe = req.cookies?.[REMEMBER_COOKIE] === "1";
  setSessionCookies(res, refreshToken, rememberMe);
  res.json({ accessToken, user });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
  if (token) await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.clearCookie(REMEMBER_COOKIE, { path: "/api/auth" });
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  res.json({ user });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.id, currentPassword, newPassword);
  res.status(204).send();
});
