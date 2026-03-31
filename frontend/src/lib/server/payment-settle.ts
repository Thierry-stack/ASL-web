import { prisma } from "./prisma";
import { verifyTransactionById } from "./flutterwave";

export async function settlePaymentFromFlutterwaveTransactionId(
  transactionId: string,
  options?: { expectedTxRef?: string; expectedUserId?: string },
): Promise<{ ok: boolean; paymentId?: string; reason?: string }> {
  const verified = await verifyTransactionById(transactionId);
  if (verified.status !== "success" || !verified.data) {
    return { ok: false, reason: verified.message || "Verification failed" };
  }

  const d = verified.data;
  const txRef = String(d.tx_ref ?? "");
  if (options?.expectedTxRef && txRef !== options.expectedTxRef) {
    return { ok: false, reason: "tx_ref mismatch" };
  }

  const status = String(d.status ?? "").toLowerCase();
  if (status !== "successful") {
    return { ok: false, reason: `Payment status: ${d.status}` };
  }

  const payment = await prisma.payment.findFirst({
    where: { flutterwaveReference: txRef },
  });
  if (!payment) {
    return { ok: false, reason: "Payment record not found for tx_ref" };
  }
  if (payment.status === "COMPLETED") {
    return { ok: true, paymentId: payment.id };
  }
  if (payment.status !== "PENDING") {
    return { ok: false, reason: "Payment is not pending" };
  }

  if (options?.expectedUserId && payment.userId !== options.expectedUserId) {
    return { ok: false, reason: "Forbidden" };
  }

  const expectedMajor = payment.amountCents / 100;
  const got = d.amount ?? d.charged_amount;
  if (got != null && Math.abs(Number(got) - expectedMajor) > 0.02) {
    return { ok: false, reason: "Amount mismatch" };
  }
  if (d.currency && payment.currency && String(d.currency) !== String(payment.currency)) {
    return { ok: false, reason: "Currency mismatch" };
  }

  const prevMeta =
    typeof payment.metadata === "object" && payment.metadata !== null && !Array.isArray(payment.metadata)
      ? (payment.metadata as Record<string, unknown>)
      : {};

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "COMPLETED",
      flutterwaveTxId: String(d.id ?? transactionId),
      metadata: {
        ...prevMeta,
        verifiedAt: new Date().toISOString(),
      },
    },
  });

  return { ok: true, paymentId: payment.id };
}
