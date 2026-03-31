import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { isCourseFree, hasPaidAccess } from "../lib/course-access.js";

const router = Router();

router.use(requireAuth);

router.get("/enrollments", async (req, res, next) => {
  try {
    const userId = req.user!.id;
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
    res.json({
      enrollments: rows.map((r) => ({
        id: r.id,
        enrolledAt: r.enrolledAt,
        course: r.course,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.post("/courses/:courseId/enroll", async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.id;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    if (!course.published && req.user!.role !== "ADMIN") {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      res.status(409).json({ error: "Already enrolled" });
      return;
    }

    if (!isCourseFree(course)) {
      const paid = await hasPaidAccess(userId, courseId);
      if (!paid) {
        res.status(402).json({
          error: "Payment required",
          message: "Complete payment for this course before enrolling.",
        });
        return;
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
    res.status(201).json({ enrollment });
  } catch (e) {
    next(e);
  }
});

router.post("/lessons/:lessonId/complete", async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user!.id;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
    });
    if (!enrollment && req.user!.role !== "ADMIN") {
      res.status(403).json({ error: "Enroll in the course to track progress" });
      return;
    }

    const row = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      create: { userId, lessonId },
      update: {},
    });
    res.json({ progress: row });
  } catch (e) {
    next(e);
  }
});

export default router;
