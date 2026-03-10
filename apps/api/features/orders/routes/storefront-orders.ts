import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { z } from "zod";
import { createOrderSchema, orderService } from "../services/order-service.js";
import { capturePosthogEvent } from "../../../shared/utils/posthog.js";
import {
  notifyCustomerOrderReceived,
  notifySellerNewOrder,
} from "../../messaging/services/notifications.js";
import { dispatchDeliveryProviderForOrder } from "../../payments/services/delivery-dispatch.js";
import { collectoApiFetch, getCollectoBaseUrl } from "../../payments/routes/collecto-http.js";

export const storefrontOrdersRouter: ExpressRouter = Router();

const checkoutSchema = createOrderSchema.extend({
  amount: z.number().positive().optional(),
});

const COLLECTO_REFERENCE_SEPARATOR = "::";

function getCollectoMode(): "disabled" | "live" {
  const value = (process.env.COLLECTO_PAYMENT_MODE || "disabled").trim().toLowerCase();
  return value === "live" ? "live" : "disabled";
}

function isCollectoConfiguredForLive() {
  return Boolean(process.env.COLLECTO_USERNAME && process.env.COLLECTO_API_KEY);
}

function normalizeCollectoPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `256${digits.slice(1)}`;
  return digits;
}

function getCollectoPayloadRecord(payload: Record<string, unknown>) {
  const nested = payload.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }

  return null;
}

function readCandidateTransactionId(payload: Record<string, unknown>): string | null {
  const nested = getCollectoPayloadRecord(payload);
  const candidates = [
    nested?.transactionId,
    nested?.transactionID,
    nested?.transaction_id,
    nested?.id,
    payload.transactionId,
    payload.transactionID,
    payload.transaction_id,
    payload.id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function logCollectoCheckoutDebug(event: string, payload: Record<string, unknown>) {
  console.info(`[CollectoCheckout] ${event}`, payload);
}

function captureOrderCreated(order: Awaited<ReturnType<typeof orderService.createOrder>>, slug: string) {
  capturePosthogEvent({
    distinctId: order.customerEmail || order.id,
    event: "order_created",
    properties: {
      orderId: order.id,
      storeSlug: slug,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      currency: order.currency,
    },
  });
}

async function notifyOrderCreated(order: Awaited<ReturnType<typeof orderService.createOrder>>) {
  const sellerPhone = await orderService.getTenantPhoneByTenantId(order.tenantId);
  await Promise.allSettled([
    notifySellerNewOrder({ sellerPhone, order }),
    notifyCustomerOrderReceived({ order }),
    dispatchDeliveryProviderForOrder(order.id),
  ]);
}

storefrontOrdersRouter.post("/storefront/:slug/checkout", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const input = checkoutSchema.parse(req.body);

    const order = await orderService.createOrder(slug, input);

    captureOrderCreated(order, slug);
    await notifyOrderCreated(order);

    if (input.paymentMethod !== "mobile_money") {
      return res.status(201).json({ ok: true, order });
    }

    if (getCollectoMode() === "disabled" || !isCollectoConfiguredForLive()) {
      return res.status(503).json({
        error: {
          code: "COLLECTO_DISABLED",
          message: "Mobile money is not enabled for this storefront.",
        },
      });
    }

    const reference = `${slug}${COLLECTO_REFERENCE_SEPARATOR}${order.id}`;
    const phone = normalizeCollectoPhone(input.customerPhone || "");
    const amount = input.amount ?? order.totalAmount;

    logCollectoCheckoutDebug("initiate:request", {
      slug,
      orderId: order.id,
      amount,
      phone,
      reference,
      collectoBaseUrl: getCollectoBaseUrl(),
    });

    let response;
    try {
      response = await collectoApiFetch("requestToPay", {
        paymentOption: "mobilemoney",
        phone,
        amount,
        reference,
      });
    } catch (error) {
      console.error("[CollectoCheckout] initiate:exception", {
        slug,
        orderId: order.id,
        amount,
        phone,
        reference,
        collectoBaseUrl: getCollectoBaseUrl(),
        error,
      });
      return res.status(502).json({
        error: {
          code: "COLLECTO_INITIATE_EXCEPTION",
          message: "Failed to reach Collecto mobile money service.",
        },
      });
    }

    logCollectoCheckoutDebug("initiate:response", {
      slug,
      orderId: order.id,
      status: response.status,
      ok: response.ok,
      body: response.json,
      text: response.text,
    });

    if (!response.ok) {
      return res.status(response.status || 502).json({
        error: {
          code: "COLLECTO_INITIATE_FAILED",
          message: "Failed to initiate Collecto mobile money payment.",
          details: response.json || response.text,
        },
      });
    }

    const payload = (response.json ?? {}) as Record<string, unknown>;
    const transactionId = readCandidateTransactionId(payload);

    if (!transactionId) {
      console.error("[CollectoCheckout] initiate:missing-transaction-id", {
        slug,
        orderId: order.id,
        amount,
        phone,
        reference,
        body: response.json,
        text: response.text,
      });
      return res.status(502).json({
        error: {
          code: "COLLECTO_INITIATE_MISSING_TRANSACTION_ID",
          message: "Collecto did not return a transaction ID for status tracking.",
          details: response.json || response.text,
        },
      });
    }

    return res.status(201).json({
      ok: true,
      order,
      payment: {
        mode: "live",
        transactionId,
        reference,
        raw: response.json,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/storefront/:slug/orders
storefrontOrdersRouter.post("/storefront/:slug/orders", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const input = createOrderSchema.parse(req.body);

    const order = await orderService.createOrder(slug, input);

    captureOrderCreated(order, slug);
    await notifyOrderCreated(order);

    return res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

