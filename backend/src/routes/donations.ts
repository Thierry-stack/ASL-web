import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { chargeRwandaMobileMoney } from "../lib/flutterwave.js";
import { settleDonationFromFlutterwaveTransactionId } from "../lib/donation-settle.js";
import { normalizeRwandaMtnPhone } from "../lib/rwanda-phone.js";

const router = Router();

function publicAppUrl(): string {
  const u = process.env.PUBLIC_APP_URL;
  if (!u) {
    throw new Error("PUBLIC_APP_URL must be set (e.g. http://localhost:3000)");
  }
  return u.replace(/\/$/, "");
}

const DEFAULT_AMOUNT_RWF = Number(process.env.DONATION_DEFAULT_AMOUNT_RWF ?? "1500") || 1500;

router.post("/momo/initiate", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        phoneNumber: z.string().min(8),
        amountRwf: z.number().int().min(100).max(10_000_000).optional(),
        email: z.string().email().optional(),
        fullName: z.string().max(120).optional(),
      })
      .safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const amountRwf = parsed.data.amountRwf ?? DEFAULT_AMOUNT_RWF;
    const phone = normalizeRwandaMtnPhone(parsed.data.phoneNumber);
    if (!phone) {
      res.status(400).json({
        error:
          "Enter a valid Rwanda MTN number (e.g. 0788123456 or 250788123456). Other countries need a different Flutterwave charge type.",
      });
      return;
    }

    const email =
      parsed.data.email?.trim() || `donor-${randomUUID().slice(0, 8)}@example.com`;

    const txRef = `don_${randomUUID().replace(/-/g, "")}`;
    const orderId = `ord_${randomUUID().replace(/-/g, "")}`;

    const donation = await prisma.donation.create({
      data: {
        amountCents: amountRwf,
        currency: "RWF",
        status: "PENDING",
        flutterwaveReference: txRef,
        phoneNumber: phone,
        donorEmail: parsed.data.email?.trim() || null,
        metadata: { source: "donate_page" },
      },
    });

    try {
      const result = await chargeRwandaMobileMoney({
        tx_ref: txRef,
        order_id: orderId,
        amount: amountRwf,
        currency: "RWF",
        email,
        phone_number: phone,
        fullname: parsed.data.fullName?.trim() || "Donor",
      });

      const prevMeta =
        typeof donation.metadata === "object" && donation.metadata !== null && !Array.isArray(donation.metadata)
          ? (donation.metadata as Record<string, unknown>)
          : {};

      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          metadata: {
            ...prevMeta,
            flutterwaveInit: {
              message: result.message,
              transactionId: result.transactionId,
              authorization: result.authorization,
            },
          },
        },
      });

      res.json({
        ok: true,
        txRef,
        donationId: donation.id,
        message: result.message ?? "Charge initiated — check your phone for the MTN Mobile Money prompt or SMS.",
        transactionId: result.transactionId,
        authorization: result.authorization,
        confirmHint:
          "After you approve on your phone, you can verify status below with the transaction ID from Flutterwave (or wait for the webhook).",
      });
    } catch (e) {
      const prev =
        typeof donation.metadata === "object" && donation.metadata !== null && !Array.isArray(donation.metadata)
          ? (donation.metadata as Record<string, unknown>)
          : {};
      const msg = e instanceof Error ? e.message : String(e);
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: "FAILED",
          metadata: {
            ...prev,
            error: msg,
          },
        },
      });
      res.status(400).json({ error: msg });
    }
  } catch (e) {
    next(e);
  }
});

router.post("/momo/confirm", async (req, res, next) => {
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
    const result = await settleDonationFromFlutterwaveTransactionId(transactionId);

    if (!result.ok) {
      res.status(400).json({ error: result.reason || "Could not confirm donation" });
      return;
    }

    res.json({ ok: true, donationId: result.donationId });
  } catch (e) {
    next(e);
  }
});

/** Redirect target after hosted step (if Flutterwave returns a redirect). */
router.get("/momo/return", (_req, res) => {
  const base = publicAppUrl();
  res.redirect(302, `${base}/donate?momo=return`);
});

export default router;
