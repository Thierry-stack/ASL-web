import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireBearerAuth } from "@/lib/server/auth-request";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} as const;

export async function GET(request: Request) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const user = await prisma.user.findUnique({
      where: { id: auth.user.sub },
      select: publicUserSelect,
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (e) {
    return handleRouteError(e);
  }
}
