import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { slugify } from "@/lib/server/slug";
import { requireBearerAuth, requireRole } from "@/lib/server/auth-request";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

const patchCourseSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(20000).optional(),
    slug: z.string().max(130).optional(),
    priceCents: z.number().int().min(0).nullable().optional(),
    currency: z.string().length(3).optional(),
    thumbnailUrl: z.string().max(2000).nullable().optional(),
    published: z.boolean().optional(),
  })
  .partial();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const forbidden = requireRole(auth.user, "ADMIN");
    if (forbidden) return forbidden;

    const { courseId } = await context.params;
    const body = await request.json();
    const parsed = patchCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    let nextSlug: string | undefined;
    if (data.slug !== undefined && data.slug.trim() !== "") {
      const s = slugify(data.slug);
      if (s !== existing.slug) {
        const clash = await prisma.course.findFirst({ where: { slug: s, NOT: { id: courseId } } });
        if (clash) {
          return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
        }
        nextSlug = s;
      }
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(nextSlug !== undefined && { slug: nextSlug }),
        ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.published !== undefined && { published: data.published }),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
    return NextResponse.json({ course });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const forbidden = requireRole(auth.user, "ADMIN");
    if (forbidden) return forbidden;

    const { courseId } = await context.params;
    try {
      await prisma.course.delete({ where: { id: courseId } });
      return new NextResponse(null, { status: 204 });
    } catch (e: unknown) {
      const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
      if (code === "P2025") {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }
      throw e;
    }
  } catch (e) {
    return handleRouteError(e);
  }
}
