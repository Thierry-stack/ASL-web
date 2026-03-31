import { randomUUID } from "crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { chargeRwandaMobileMoney } from "@/lib/server/flutterwave";
import { normalizeRwandaMtnPhone } from "@/lib/server/rwanda-phone";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

const DEFAULT_AMOUNT_RWF = Number(process.env.DONATION_DEFAULT_AMOUNT_RWF ?? "1500") || 1500;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = z
      .object({
        phoneNumber: z.string().min(8),
        amountRwf: z.number().int().min(100).max(10_000_000).optional(),
        email: z.string().email().optional(),
        fullName: z.string().max(120).optional(),
      })
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const amountRwf = parsed.data.amountRwf ?? DEFAULT_AMOUNT_RWF;
    const phone = normalizeRwandaMtnPhone(parsed.data.phoneNumber);
    if (!phone) {
      return NextResponse.json(
        {
          error:
            "Enter a valid Rwanda MTN number (e.g. 0788123456 or 250788123456). Other countries need a different Flutterwave charge type.",
        },
        { status: 400 },
      );
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

      return NextResponse.json({
        ok: true,
        txRef,
        donationId: donation.id,
        message:
          result.message ?? "Charge initiated — check your phone for the MTN Mobile Money prompt or SMS.",
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
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (e) {
    return handleRouteError(e);
  }
}
