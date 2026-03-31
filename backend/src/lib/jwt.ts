import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

export type JwtPayload = { sub: string; role: UserRole };

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required in backend/.env");
  }
  return secret;
}

export function signJwt(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  return jwt.sign(payload, getSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyJwt(token: string): JwtPayload {
  const decoded = jwt.verify(token, getSecret()) as jwt.JwtPayload & JwtPayload;
  if (typeof decoded.sub !== "string" || !decoded.role) {
    throw new Error("Invalid token payload");
  }
  return { sub: decoded.sub, role: decoded.role };
}
