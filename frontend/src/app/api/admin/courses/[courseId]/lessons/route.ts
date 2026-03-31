import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireBearerAuth, requireRole } from "@/lib/server/auth-request";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

const materialSchema = z.object({
  label: z.string().min(1).max(200),
  url: z.string().min(1).max(2000),
});

const createLessonSchema = z.object({
  title: z.string().min(1).max(300),
  sortOrder: z.number().int().min(0).optional(),
  videoUrl: z.string().min(1).max(2000),
  captionUrl: z.string().max(2000).nullable().optional(),
  materials: z.array(materialSchema).max(50).optional(),
});

export async function POST(
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
    const parsed = createLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const data = parsed.data;
    const maxOrder = await prisma.lesson.aggregate({
      where: { courseId },
      _max: { sortOrder: true },
    });
    const sortOrder = data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title: data.title.trim(),
        sortOrder,
        videoUrl: data.videoUrl.trim(),
        captionUrl: data.captionUrl ?? null,
        materials: data.materials ? data.materials : undefined,
      },
    });
    return NextResponse.json({ lesson }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
