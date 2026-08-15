import argon2 from "argon2";
import type { AuthUser, JwtAccessPayload, Permission, RoleName } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, refreshExpiryDate } from "../../lib/tokens";
import { UnauthorizedError, BadRequestError } from "../../lib/errors";

async function loadAuthUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });

  const roles = user.roles.map((ur) => ur.role.name as RoleName);
  const permissions = Array.from(
    new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key as Permission)))
  );

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    schoolId: user.schoolId,
    roles,
    permissions,
  };
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

async function issueTokens(authUser: AuthUser, ip?: string): Promise<TokenPair> {
  const payload: JwtAccessPayload = {
    sub: authUser.id,
    schoolId: authUser.schoolId,
    roles: authUser.roles,
    permissions: authUser.permissions,
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(authUser.id);

  await prisma.refreshToken.create({
    data: {
      userId: authUser.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiryDate(),
      createdByIp: ip,
    },
  });

  return { accessToken, refreshToken };
}

export async function login(email: string, password: string, ip?: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new UnauthorizedError("Invalid email or password");

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  const authUser = await loadAuthUser(user.id);
  const tokens = await issueTokens(authUser, ip);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return { ...tokens, user: authUser };
}

export async function refreshSession(refreshToken: string, ip?: string) {
  let decoded: { sub: string };
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { userId: decoded.sub, tokenHash, revokedAt: null },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token is no longer valid");
  }

  const authUser = await loadAuthUser(decoded.sub);
  const tokens = await issueTokens(authUser, ip);

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedById: null },
  });

  return { ...tokens, user: authUser };
}

export async function logout(refreshToken: string) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string): Promise<AuthUser> {
  return loadAuthUser(userId);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await argon2.verify(user.passwordHash, currentPassword);
  if (!valid) throw new BadRequestError("Current password is incorrect");

  const passwordHash = await argon2.hash(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}
