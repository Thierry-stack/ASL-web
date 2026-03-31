import { randomUUID } from "crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { createStandardPaymentLink } from "@/lib/server/flutterwave";
import { isCourseFree } from "@/lib/server/course-access";
import { requireBearerAuth } from "@/lib/server/auth-request";
import { publicAppUrl } from "@/lib/server/public-app-url";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const userId = auth.user.sub;

    const body = await request.json();
    const parsed = z.object({ courseId: z.string().min(1) }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const { courseId } = parsed.data;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || !course.published) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (isCourseFree(course)) {
      return NextResponse.json({ error: "This course is free — enroll without payment" }, { status: 400 });
    }

    const existingPaid = await prisma.payment.findFirst({
      where: { userId, courseId, status: "COMPLETED" },
    });
    if (existingPaid) {
      return NextResponse.json({ error: "You already have access to this course" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const amountMajor = course.priceCents! / 100;
    const txRef = `lms_${randomUUID().replace(/-/g, "")}`;

    const payment = await prisma.payment.create({
      data: {
        userId,
        courseId,
        amountCents: course.priceCents!,
        currency: course.currency,
        status: "PENDING",
        flutterwaveReference: txRef,
        metadata: { courseSlug: course.slug },
      },
    });

    const redirectUrl = `${publicAppUrl()}/courses/${encodeURIComponent(course.slug)}?payment=pending`;

    try {
      const { link } = await createStandardPaymentLink({
        tx_ref: txRef,
        amount: amountMajor,
        currency: course.currency,
        redirect_url: redirectUrl,
        customer: {
          email: user.email,
          name: user.name,
        },
        meta: {
          payment_id: payment.id,
          course_id: course.id,
        },
      });

      return NextResponse.json({ link, txRef, paymentId: payment.id });
    } catch (e) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadata: { error: e instanceof Error ? e.message : String(e) },
        },
      });
      throw e;
    }
  } catch (e) {
    return handleRouteError(e);
  }
}
