import { z } from "zod";
import { NextResponse } from "next/server";
import { settleDonationFromFlutterwaveTransactionId } from "@/lib/server/donation-settle";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
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
    const result = await settleDonationFromFlutterwaveTransactionId(transactionId);

    if (!result.ok) {
      return NextResponse.json({ error: result.reason || "Could not confirm donation" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, donationId: result.donationId });
  } catch (e) {
    return handleRouteError(e);
  }
}
