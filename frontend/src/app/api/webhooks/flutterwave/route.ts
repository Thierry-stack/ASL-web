import { NextResponse } from "next/server";
import { settlePaymentFromFlutterwaveTransactionId } from "@/lib/server/payment-settle";
import { settleDonationFromFlutterwaveTransactionId } from "@/lib/server/donation-settle";
import { verifyWebhookSignature } from "@/lib/server/flutterwave";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const hash = request.headers.get("verif-hash") ?? undefined;
    if (process.env.FLUTTERWAVE_SECRET_HASH && !verifyWebhookSignature(hash)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = (await request.json()) as {
      event?: string;
      data?: { id?: number | string; tx_ref?: string };
    };

    const txId = body.data?.id;
    if (txId == null) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const pay = await settlePaymentFromFlutterwaveTransactionId(String(txId));
    if (!pay.ok && pay.reason === "Payment record not found for tx_ref") {
      const don = await settleDonationFromFlutterwaveTransactionId(String(txId));
      if (!don.ok) {
        console.warn("[webhook flutterwave] donation:", don.reason);
      }
    } else if (!pay.ok) {
      console.warn("[webhook flutterwave]", pay.reason);
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
