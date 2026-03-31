import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { slugify } from "@/lib/server/slug";
import { requireBearerAuth, requireRole } from "@/lib/server/auth-request";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
  slug: z.string().max(130).optional(),
  priceCents: z.number().int().min(0).nullable().optional(),
  currency: z.string().length(3).optional(),
  thumbnailUrl: z.string().max(2000).nullable().optional(),
  published: z.boolean().optional(),
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

export async function GET(request: Request) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const forbidden = requireRole(auth.user, "ADMIN");
    if (forbidden) return forbidden;

    const courses = await prisma.course.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
    return NextResponse.json({ courses });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const forbidden = requireRole(auth.user, "ADMIN");
    if (forbidden) return forbidden;

    const body = await request.json();
    const parsed = createCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const authorId = auth.user.sub;

    let slug: string;
    if (data.slug?.trim()) {
      const s = slugify(data.slug.trim());
      const clash = await prisma.course.findUnique({ where: { slug: s } });
      if (clash) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
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
    return NextResponse.json({ course }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
