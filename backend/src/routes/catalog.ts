import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { verifyJwt } from "../lib/jwt.js";
import type { JwtPayload } from "../lib/jwt.js";
import { hasPaidAccess } from "../lib/course-access.js";

const router = Router();

function optionalAuth(req: import("express").Request): JwtPayload | null {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;
  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}

router.get("/", async (_req, res, next) => {
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
    res.json({
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
    next(e);
  }
});

router.get("/by-slug/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const auth = optionalAuth(req);

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, email: true } },
        lessons: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const isAdmin = auth?.role === "ADMIN";
    if (!course.published && !isAdmin) {
      res.status(404).json({ error: "Course not found" });
      return;
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

    res.json({
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
    next(e);
  }
});

export default router;
