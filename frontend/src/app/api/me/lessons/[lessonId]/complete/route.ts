import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireBearerAuth } from "@/lib/server/auth-request";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const { lessonId } = await context.params;
    const userId = auth.user.sub;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
    });
    if (!enrollment && auth.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Enroll in the course to track progress" }, { status: 403 });
    }

    const row = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      create: { userId, lessonId },
      update: {},
    });
    return NextResponse.json({ progress: row });
  } catch (e) {
    return handleRouteError(e);
  }
}
