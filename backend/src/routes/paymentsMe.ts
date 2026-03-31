import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createStandardPaymentLink } from "../lib/flutterwave.js";
import { isCourseFree } from "../lib/course-access.js";
import { settlePaymentFromFlutterwaveTransactionId } from "../lib/payment-settle.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function publicAppUrl(): string {
  const u = process.env.PUBLIC_APP_URL;
  if (!u) {
    throw new Error("PUBLIC_APP_URL must be set (e.g. http://localhost:3000)");
  }
  return u.replace(/\/$/, "");
}

router.post("/flutterwave/initiate", async (req, res, next) => {
  try {
    const parsed = z.object({ courseId: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }
    const { courseId } = parsed.data;
    const userId = req.user!.id;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || !course.published) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    if (isCourseFree(course)) {
      res.status(400).json({ error: "This course is free — enroll without payment" });
      return;
    }

    const existingPaid = await prisma.payment.findFirst({
      where: { userId, courseId, status: "COMPLETED" },
    });
    if (existingPaid) {
      res.status(400).json({ error: "You already have access to this course" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
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

      res.json({ link, txRef, paymentId: payment.id });
    } catch (e) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadata: { error: e instanceof Error ? e.message : String(e) },
        },
      });
      next(e);
    }
  } catch (e) {
    next(e);
  }
});

router.post("/flutterwave/confirm", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        transaction_id: z.union([z.string(), z.number()]),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }
    const transactionId = String(parsed.data.transaction_id);
    const userId = req.user!.id;

    const result = await settlePaymentFromFlutterwaveTransactionId(transactionId, {
      expectedUserId: userId,
    });

    if (!result.ok) {
      res.status(400).json({ error: result.reason || "Could not confirm payment" });
      return;
    }

    res.json({ ok: true, paymentId: result.paymentId });
  } catch (e) {
    next(e);
  }
});

export default router;
