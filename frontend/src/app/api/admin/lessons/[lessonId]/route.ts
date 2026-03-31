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

const patchLessonSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    sortOrder: z.number().int().min(0).optional(),
    videoUrl: z.string().min(1).max(2000).optional(),
    captionUrl: z.string().max(2000).nullable().optional(),
    materials: z.array(materialSchema).max(50).optional(),
  })
  .partial();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const forbidden = requireRole(auth.user, "ADMIN");
    if (forbidden) return forbidden;

    const { lessonId } = await context.params;
    const body = await request.json();
    const parsed = patchLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const existing = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!existing) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl.trim() }),
        ...(data.captionUrl !== undefined && { captionUrl: data.captionUrl }),
        ...(data.materials !== undefined && { materials: data.materials }),
      },
    });
    return NextResponse.json({ lesson });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const forbidden = requireRole(auth.user, "ADMIN");
    if (forbidden) return forbidden;

    const { lessonId } = await context.params;
    try {
      await prisma.lesson.delete({ where: { id: lessonId } });
      return new NextResponse(null, { status: 204 });
    } catch (e: unknown) {
      const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
      if (code === "P2025") {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }
      throw e;
    }
  } catch (e) {
    return handleRouteError(e);
  }
}
