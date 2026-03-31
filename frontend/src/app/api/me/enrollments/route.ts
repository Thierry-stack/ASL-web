import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireBearerAuth } from "@/lib/server/auth-request";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const userId = auth.user.sub;

    const rows = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnailUrl: true,
            priceCents: true,
            currency: true,
            published: true,
            _count: { select: { lessons: true } },
          },
        },
      },
    });

    return NextResponse.json({
      enrollments: rows.map((r) => ({
        id: r.id,
        enrolledAt: r.enrolledAt,
        course: r.course,
      })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
