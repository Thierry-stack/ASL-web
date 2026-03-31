import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getOptionalBearerAuth } from "@/lib/server/auth-request";
import { hasPaidAccess } from "@/lib/server/course-access";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const auth = getOptionalBearerAuth(request);

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, email: true } },
        lessons: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const isAdmin = auth?.role === "ADMIN";
    if (!course.published && !isAdmin) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    let enrolled = false;
    let completedLessonIds: string[] = [];
    let paidForCourse = false;
    if (auth) {
      const e = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: auth.sub, courseId: course.id } },
      });
      enrolled = !!e;
      if (enrolled) {
        const done = await prisma.lessonProgress.findMany({
          where: { userId: auth.sub, lesson: { courseId: course.id } },
          select: { lessonId: true },
        });
        completedLessonIds = done.map((d) => d.lessonId);
      }
      if ((course.priceCents ?? 0) > 0) {
        paidForCourse = await hasPaidAccess(auth.sub, course.id);
      }
    }

    const showVideos = isAdmin || enrolled;

    const lessons = course.lessons.map((l) => {
      if (showVideos) {
        return {
          id: l.id,
          title: l.title,
          sortOrder: l.sortOrder,
          videoUrl: l.videoUrl,
          captionUrl: l.captionUrl,
          materials: l.materials,
        };
      }
      return {
        id: l.id,
        title: l.title,
        sortOrder: l.sortOrder,
      };
    });

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        priceCents: course.priceCents,
        currency: course.currency,
        published: course.published,
        author: course.author,
        enrolled,
        paidForCourse,
        completedLessonIds,
        lessons,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
