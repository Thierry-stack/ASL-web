import { z } from "zod";
import { NextResponse } from "next/server";
import { settlePaymentFromFlutterwaveTransactionId } from "@/lib/server/payment-settle";
import { requireBearerAuth } from "@/lib/server/auth-request";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = requireBearerAuth(request);
    if (auth instanceof Response) return auth;
    const userId = auth.user.sub;

    const body = await request.json();
    const parsed = z
      .object({
        transaction_id: z.union([z.string(), z.number()]),
      })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const transactionId = String(parsed.data.transaction_id);
    const result = await settlePaymentFromFlutterwaveTransactionId(transactionId, {
      expectedUserId: userId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason || "Could not confirm payment" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, paymentId: result.paymentId });
  } catch (e) {
    return handleRouteError(e);
  }
}
