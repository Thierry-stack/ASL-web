import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireBearerAuth } from "@/lib/server/auth-request";
import { isCourseFree, hasPaidAccess } from "@/lib/server/course-access";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const { courseId } = await context.params;
    const userId = auth.user.sub;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (!course.published && auth.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    if (!isCourseFree(course)) {
      const paid = await hasPaidAccess(userId, courseId);
      if (!paid) {
        return NextResponse.json(
          {
            error: "Payment required",
            message: "Complete payment for this course before enrolling.",
          },
          { status: 402 },
        );
      }
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId },
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
          },
        },
      },
    });
    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
