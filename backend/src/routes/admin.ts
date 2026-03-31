import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { slugify } from "../lib/slug.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

const materialSchema = z.object({
  label: z.string().min(1).max(200),
  url: z.string().min(1).max(2000),
});

async function uniqueCourseSlug(base: string): Promise<string> {
  const head = slugify(base) || "course";
  let suffix = 0;
  for (;;) {
    const candidate = suffix === 0 ? head : `${head}-${suffix}`;
    const exists = await prisma.course.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    suffix += 1;
    if (suffix > 200) throw new Error("Could not allocate unique slug");
  }
}

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
  slug: z.string().max(130).optional(),
  priceCents: z.number().int().min(0).nullable().optional(),
  currency: z.string().length(3).optional(),
  thumbnailUrl: z.string().max(2000).nullable().optional(),
  published: z.boolean().optional(),
});

const patchCourseSchema = createCourseSchema.partial();

const createLessonSchema = z.object({
  title: z.string().min(1).max(300),
  sortOrder: z.number().int().min(0).optional(),
  videoUrl: z.string().min(1).max(2000),
  captionUrl: z.string().max(2000).nullable().optional(),
  materials: z.array(materialSchema).max(50).optional(),
});

const patchLessonSchema = createLessonSchema.partial();

router.get("/courses", async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
    res.json({ courses });
  } catch (e) {
    next(e);
  }
});

router.post("/courses", async (req, res, next) => {
  try {
    const parsed = createCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }
    const data = parsed.data;
    const authorId = req.user!.id;

    let slug: string;
    if (data.slug?.trim()) {
      const s = slugify(data.slug.trim());
      const clash = await prisma.course.findUnique({ where: { slug: s } });
      if (clash) {
        res.status(409).json({ error: "Slug already in use" });
        return;
      }
      slug = s;
    } else {
      slug = await uniqueCourseSlug(data.title);
    }

    const course = await prisma.course.create({
      data: {
        title: data.title.trim(),
        slug,
        description: data.description,
        priceCents: data.priceCents ?? null,
        currency: data.currency ?? "NGN",
        thumbnailUrl: data.thumbnailUrl ?? null,
        published: data.published ?? false,
        authorId,
      },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ course });
  } catch (e) {
    next(e);
  }
});

router.patch("/courses/:courseId", async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const parsed = patchCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }
    const data = parsed.data;
    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    let nextSlug: string | undefined;
    if (data.slug !== undefined && data.slug.trim() !== "") {
      const s = slugify(data.slug);
      if (s !== existing.slug) {
        const clash = await prisma.course.findFirst({ where: { slug: s, NOT: { id: courseId } } });
        if (clash) {
          res.status(409).json({ error: "Slug already in use" });
          return;
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
    res.json({ course });
  } catch (e) {
    next(e);
  }
});

router.delete("/courses/:courseId", async (req, res, next) => {
  try {
    const { courseId } = req.params;
    await prisma.course.delete({ where: { id: courseId } });
    res.status(204).send();
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2025") {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    next(e);
  }
});

router.post("/courses/:courseId/lessons", async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const parsed = createLessonSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
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
    res.status(201).json({ lesson });
  } catch (e) {
    next(e);
  }
});

router.patch("/lessons/:lessonId", async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const parsed = patchLessonSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }
    const data = parsed.data;
    const existing = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!existing) {
      res.status(404).json({ error: "Lesson not found" });
      return;
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
    res.json({ lesson });
  } catch (e) {
    next(e);
  }
});

router.delete("/lessons/:lessonId", async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    await prisma.lesson.delete({ where: { id: lessonId } });
    res.status(204).send();
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2025") {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }
    next(e);
  }
});

export default router;
