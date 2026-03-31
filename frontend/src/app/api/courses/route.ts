import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        priceCents: true,
        currency: true,
        updatedAt: true,
        author: { select: { name: true, email: true } },
        _count: { select: { lessons: true } },
      },
    });
    return NextResponse.json({
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        thumbnailUrl: c.thumbnailUrl,
        priceCents: c.priceCents,
        currency: c.currency,
        updatedAt: c.updatedAt,
        lessonCount: c._count.lessons,
        author: c.author,
      })),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
