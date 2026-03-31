const API_BASE = "https://api.flutterwave.com/v3";

function getSecretKey(): string {
  const k = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!k) throw new Error("FLUTTERWAVE_SECRET_KEY is not set");
  return k;
}

export type CreateStandardPaymentParams = {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: { email: string; name?: string | null; phone_number?: string };
  meta?: Record<string, string>;
};

export async function createStandardPaymentLink(
  params: CreateStandardPaymentParams,
): Promise<{ link: string }> {
  const res = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: params.tx_ref,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirect_url,
      payment_options: "card,banktransfer,ussd,account,mpesa",
      customer: {
        email: params.customer.email,
        ...(params.customer.name ? { name: params.customer.name } : {}),
        ...(params.customer.phone_number ? { phone_number: params.customer.phone_number } : {}),
      },
      customizations: {
        title: "Course payment",
        description: "Sign Language LMS",
      },
      ...(params.meta ? { meta: params.meta } : {}),
    }),
  });

  const json = (await res.json()) as {
    status?: string;
    message?: string;
    data?: { link?: string };
  };

  if (!res.ok || json.status !== "success" || !json.data?.link) {
    throw new Error(json.message || "Flutterwave did not return a payment link");
  }

  return { link: json.data.link };
}

/** Rwanda MTN / M-Pesa MoMo — customer gets a prompt or SMS to approve on their phone. */
export type RwandaMoMoChargeParams = {
  tx_ref: string;
  order_id: string;
  amount: number;
  currency: "RWF";
  email: string;
  phone_number: string;
  fullname?: string;
};

export type RwandaMoMoChargeResult = {
  status: string;
  message?: string;
  transactionId?: number;
  authorization?: {
    mode?: string;
    redirect?: string;
    note?: string;
  };
  raw: unknown;
};

export async function chargeRwandaMobileMoney(
  params: RwandaMoMoChargeParams,
): Promise<RwandaMoMoChargeResult> {
  const res = await fetch(`${API_BASE}/charges?type=mobile_money_rwanda`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: params.tx_ref,
      order_id: params.order_id,
      amount: params.amount,
      currency: params.currency,
      email: params.email,
      phone_number: params.phone_number,
      ...(params.fullname ? { fullname: params.fullname } : {}),
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok || json.status !== "success") {
    const msg =
      typeof json.message === "string"
        ? json.message
        : `Flutterwave MoMo charge failed (${res.status})`;
    throw new Error(msg);
  }

  const data = json.data as Record<string, unknown> | undefined;
  const meta =
    (data?.meta as Record<string, unknown> | undefined) ??
    (json.meta as Record<string, unknown> | undefined);
  const auth = meta?.authorization as Record<string, unknown> | undefined;
  const txId =
    typeof data?.id === "number"
      ? data.id
      : typeof data?.id === "string"
        ? Number(data.id)
        : undefined;

  return {
    status: String(json.status ?? ""),
    message: typeof json.message === "string" ? json.message : undefined,
    transactionId: Number.isFinite(txId) ? txId : undefined,
    authorization: auth
      ? {
          mode: typeof auth.mode === "string" ? auth.mode : undefined,
          redirect: typeof auth.redirect === "string" ? auth.redirect : undefined,
          note: typeof auth.note === "string" ? auth.note : undefined,
        }
      : undefined,
    raw: json,
  };
}

export type VerifyTransactionResponse = {
  status: string;
  message?: string;
  data?: {
    id?: number;
    tx_ref?: string;
    flw_ref?: string;
    status?: string;
    currency?: string;
    amount?: number;
    charged_amount?: number;
    customer?: { email?: string };
    meta?: Record<string, unknown>;
  };
};

export async function verifyTransactionById(transactionId: number | string): Promise<VerifyTransactionResponse> {
  const res = await fetch(`${API_BASE}/transactions/${transactionId}/verify`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
    },
  });
  return (await res.json()) as VerifyTransactionResponse;
}

export function verifyWebhookSignature(headerHash: string | undefined): boolean {
  const secret = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secret) {
    return true;
  }
  return !!headerHash && headerHash === secret;
}

