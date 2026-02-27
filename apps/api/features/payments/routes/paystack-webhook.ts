import crypto from "crypto";
import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { db, eq } from "@shopvendly/db";
import { orders } from "@shopvendly/db";
import type { RawBodyRequest } from "../shared/types/raw-body";
import { orderService } from "../services/order-service";
import {
  notifyCustomerOrderReceived,
  notifyCustomerPreparing,
  notifySellerNewOrder,
} from "../../messaging/services/notifications";

export const paystackWebhookRouter: ExpressRouter = Router();

type PaystackEvent = {
  event?: string;
  data?: {
    amount?: number;
    currency?: string;
    metadata?: {
      orderId?: string;
    };
  };
};

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

paystackWebhookRouter.post("/webhooks/paystack", async (req, res) => {
  // Paystack expects a quick response. We still do small DB writes, but avoid long blocking work.
  const rawReq = req as RawBodyRequest;
  const rawBody = rawReq.rawBody?.toString("utf8") ?? "";

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("[PaystackWebhook] Missing PAYSTACK_SECRET_KEY");
    return res.status(200).json({ received: true });
  }

  const signature = req.header("x-paystack-signature") || "";
  const expectedHash = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");

  if (!signature || signature !== expectedHash) {
    console.warn("[PaystackWebhook] Invalid signature; ignoring");
    return res.status(200).json({ received: true });
  }

  const parsed = safeJsonParse(rawBody);
  const event = (parsed || req.body) as PaystackEvent;

  if (event?.event !== "charge.success") {
    return res.status(200).json({ received: true });
  }

  const orderId = event.data?.metadata?.orderId;
  const amount = event.data?.amount;
  const currency = event.data?.currency;

  if (!orderId) {
    console.warn("[PaystackWebhook] charge.success missing metadata.orderId");
    return res.status(200).json({ received: true });
  }

  try {
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      console.warn("[PaystackWebhook] Order not found", { orderId });
      return res.status(200).json({ received: true });
    }

    // Idempotent: if already paid, skip.
    if (order.paymentStatus === "paid") {
      return res.status(200).json({ received: true, alreadyPaid: true });
    }

    // Guardrails: validate amount/currency before marking paid.
    if (typeof amount === "number" && amount !== order.totalAmount) {
      console.warn("[PaystackWebhook] Amount mismatch", {
        orderId,
        expected: order.totalAmount,
        got: amount,
      });
      return res.status(200).json({ received: true });
    }

    if (typeof currency === "string" && currency && currency !== order.currency) {
      console.warn("[PaystackWebhook] Currency mismatch", {
        orderId,
        expected: order.currency,
        got: currency,
      });
      return res.status(200).json({ received: true });
    }

    await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        status: "processing",
        paymentMethod: "paystack",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const full = await orderService.getOrderById(orderId);
    if (full) {
      const sellerPhone = await orderService.getTenantPhoneByTenantId(full.tenantId);

      await Promise.allSettled([
        notifyCustomerOrderReceived({ order: full }),
        notifyCustomerPreparing({ order: full }),
        notifySellerNewOrder({ sellerPhone, order: full }),
      ]);
    }

    console.info("[PaystackWebhook] Order marked paid + WhatsApp queued", { orderId });
  } catch (err) {
    console.error("[PaystackWebhook] Failed processing charge.success", { orderId, err });
  }

  return res.status(200).json({ received: true });
});
