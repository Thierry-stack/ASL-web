import { prisma } from "./prisma";
import { verifyTransactionById } from "./flutterwave";

export async function settleDonationFromFlutterwaveTransactionId(
  transactionId: string,
): Promise<{ ok: boolean; donationId?: string; reason?: string }> {
  const verified = await verifyTransactionById(transactionId);
  if (verified.status !== "success" || !verified.data) {
    return { ok: false, reason: verified.message || "Verification failed" };
  }

  const d = verified.data;
  const txRef = String(d.tx_ref ?? "");

  const status = String(d.status ?? "").toLowerCase();
  if (status !== "successful") {
    return { ok: false, reason: `Payment status: ${d.status}` };
  }

  const donation = await prisma.donation.findFirst({
    where: { flutterwaveReference: txRef },
  });
  if (!donation) {
    return { ok: false, reason: "Donation record not found for tx_ref" };
  }
  if (donation.status === "COMPLETED") {
    return { ok: true, donationId: donation.id };
  }
  if (donation.status !== "PENDING") {
    return { ok: false, reason: "Donation is not pending" };
  }

  const got = d.amount ?? d.charged_amount;
  if (got != null) {
    const expected =
      donation.currency === "RWF" ? donation.amountCents : donation.amountCents / 100;
    if (Math.abs(Number(got) - expected) > 0.02) {
      return { ok: false, reason: "Amount mismatch" };
    }
  }
  if (d.currency && donation.currency && String(d.currency) !== String(donation.currency)) {
    return { ok: false, reason: "Currency mismatch" };
  }

  const prevMeta =
    typeof donation.metadata === "object" && donation.metadata !== null && !Array.isArray(donation.metadata)
      ? (donation.metadata as Record<string, unknown>)
      : {};

  await prisma.donation.update({
    where: { id: donation.id },
    data: {
      status: "COMPLETED",
      flutterwaveTxId: String(d.id ?? transactionId),
      metadata: {
        ...prevMeta,
        verifiedAt: new Date().toISOString(),
      },
    },
  });

  return { ok: true, donationId: donation.id };
}
