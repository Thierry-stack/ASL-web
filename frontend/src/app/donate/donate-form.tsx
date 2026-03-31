"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, donateMomoConfirm, donateMomoInitiate } from "@/lib/api";

export function DonateForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amountRwf, setAmountRwf] = useState("1500");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    message?: string;
    txRef: string;
    transactionId?: number;
    redirect?: string;
    confirmHint?: string;
  } | null>(null);

  const [txConfirm, setTxConfirm] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const amount = amountRwf.trim() === "" ? undefined : Number.parseInt(amountRwf, 10);
      if (amount !== undefined && (Number.isNaN(amount) || amount < 100)) {
        setError("Amount must be at least 100 RWF.");
        setLoading(false);
        return;
      }
      const res = await donateMomoInitiate({
        phoneNumber,
        amountRwf: amount,
        email: email.trim() || undefined,
        fullName: fullName.trim() || undefined,
      });
      setSuccess({
        message: res.message,
        txRef: res.txRef,
        transactionId: res.transactionId,
        redirect: res.authorization?.redirect,
        confirmHint: res.confirmHint,
      });
      if (res.transactionId != null) {
        setTxConfirm(String(res.transactionId));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault();
    setConfirmMsg(null);
    const id = txConfirm.trim();
    if (!id) return;
    setConfirmLoading(true);
    try {
      const r = await donateMomoConfirm(id);
      setConfirmMsg(r.ok ? "Donation recorded successfully. Thank you!" : "Could not confirm.");
    } catch (err) {
      setConfirmMsg(err instanceof ApiError ? err.message : "Confirmation failed.");
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Pay with <strong className="font-medium text-zinc-900 dark:text-zinc-100">MTN Mobile Money (Rwanda)</strong>
          . After you submit, Flutterwave sends a prompt or SMS to your phone so you can approve the payment in the MoMo
          flow (sandbox uses test rules from your Flutterwave dashboard).
        </p>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            MTN phone number
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="e.g. 0788123456"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Amount (RWF)
          </label>
          <input
            id="amount"
            type="number"
            min={100}
            step={100}
            value={amountRwf}
            onChange={(e) => setAmountRwf(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <p className="mt-1 text-xs text-zinc-500">Default 1500 RWF — adjust for your test.</p>
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {loading ? "Starting payment…" : "Donate with MTN MoMo"}
        </button>
      </form>

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
          <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Check your phone</h2>
          <p className="mt-2 text-sm text-emerald-900/90 dark:text-emerald-100/90">
            {success.message ?? "Approve the payment when MTN Mobile Money prompts you."}
          </p>
          <p className="mt-3 font-mono text-xs text-emerald-800/80 dark:text-emerald-200/80">Ref: {success.txRef}</p>
          {success.transactionId != null && (
            <p className="mt-1 font-mono text-xs text-emerald-800/80 dark:text-emerald-200/80">
              Transaction ID: {success.transactionId}
            </p>
          )}
          {success.confirmHint && (
            <p className="mt-3 text-sm text-emerald-900/85 dark:text-emerald-100/85">{success.confirmHint}</p>
          )}
          {success.redirect && (
            <a
              href={success.redirect}
              className="mt-4 inline-flex rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              Open verification page
            </a>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Confirm payment (optional)</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          If you have a Flutterwave <strong className="font-medium text-zinc-800 dark:text-zinc-200">transaction id</strong>{" "}
          after paying, paste it here to mark the donation completed (same as webhook verification).
        </p>
        <form onSubmit={onConfirm} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="txid" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Transaction ID
            </label>
            <input
              id="txid"
              value={txConfirm}
              onChange={(e) => setTxConfirm(e.target.value)}
              placeholder="e.g. 12345678"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <button
            type="submit"
            disabled={confirmLoading || !txConfirm.trim()}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {confirmLoading ? "Checking…" : "Confirm"}
          </button>
        </form>
        {confirmMsg && <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{confirmMsg}</p>}
      </div>

      <p className="text-center text-sm text-zinc-500">
        <Link href="/" className="underline hover:text-zinc-800 dark:hover:text-zinc-300">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
