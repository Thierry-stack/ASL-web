import type { UserRole } from "@prisma/client";
import { verifyJwt, type JwtPayload } from "./jwt";

export function getOptionalBearerAuth(request: Request): JwtPayload | null {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;
  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}

export function requireBearerAuth(request: Request): { user: JwtPayload } | Response {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const user = verifyJwt(token);
    return { user };
  } catch {
    return Response.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}

export function requireRole(user: JwtPayload, ...roles: UserRole[]): Response | null {
  if (!roles.includes(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
