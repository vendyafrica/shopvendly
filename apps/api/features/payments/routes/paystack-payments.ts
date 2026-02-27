import { Router } from "express";

const PAYSTACK_API = "https://api.paystack.co";

export const paystackPaymentsRouter: Router = Router();

/**
 * POST /api/payments/paystack/initialize
 * Body: { email: string; amount: number (smallest unit); currency?: string; orderId: string; callbackUrl?: string }
 */
paystackPaymentsRouter.post("/payments/paystack/initialize", async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "Paystack not configured (PAYSTACK_SECRET_KEY missing)" });
    }

    const { email, amount, currency = "UGX", orderId, callbackUrl } = req.body ?? {};

    if (!email || !amount || !orderId) {
      return res.status(400).json({ error: "Missing required fields: email, amount, orderId" });
    }

    const psRes = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        currency,
        callback_url: callbackUrl,
        metadata: {
          orderId,
          custom_fields: [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: orderId,
            },
          ],
        },
      }),
    });

    const json = await psRes.json() as {
      status?: boolean;
      message?: string;
      data?: { access_code?: string; reference?: string; authorization_url?: string };
    };

    if (!psRes.ok || json?.status !== true) {
      console.error("[Paystack initialize API] Failed", json);
      return res.status(psRes.status || 500).json({ error: json?.message || "Failed to initialize Paystack" });
    }

    return res.status(200).json({
      access_code: json.data?.access_code,
      reference: json.data?.reference,
      authorization_url: json.data?.authorization_url,
    });
  } catch (err) {
    console.error("[Paystack initialize API] Error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
