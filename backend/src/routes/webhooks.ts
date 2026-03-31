import { Router } from "express";
import { settlePaymentFromFlutterwaveTransactionId } from "../lib/payment-settle.js";
import { settleDonationFromFlutterwaveTransactionId } from "../lib/donation-settle.js";
import { verifyWebhookSignature } from "../lib/flutterwave.js";

const router = Router();

router.post("/flutterwave", async (req, res, next) => {
  try {
    const hash = req.headers["verif-hash"] as string | undefined;
    if (process.env.FLUTTERWAVE_SECRET_HASH && !verifyWebhookSignature(hash)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const body = req.body as {
      event?: string;
      data?: { id?: number | string; tx_ref?: string };
    };

    const txId = body.data?.id;
    if (txId == null) {
      res.status(200).json({ received: true, ignored: true });
      return;
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
    res.status(200).json({ received: true });
  } catch (e) {
    next(e);
  }
});

export default router;
