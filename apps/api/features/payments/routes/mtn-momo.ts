import type { Request, Response, Router as ExpressRouter } from "express";
import { Router } from "express";
import { z } from "zod";
 import { and, db, eq, isNull, orders, stores } from "@shopvendly/db";
import { mtnMomoCollections, requestToPayInputSchema } from "../modules/mtn-momo-service.js";

export const mtnMomoRouter: ExpressRouter = Router();

const requestToPayBodySchema = requestToPayInputSchema.extend({
  orderId: z.string().uuid(),
});

function normalizeMtnPaymentStatus(status: string | undefined): "pending" | "paid" | "failed" {
  if (!status) return "pending";
  const s = status.toUpperCase();
  if (s === "SUCCESSFUL") return "paid";
  if (s === "FAILED") return "failed";
  return "pending";
}

async function updatePaymentAndOrderFromMtnStatus(referenceId: string) {
  const mtnStatus = await mtnMomoCollections.getRequestToPayStatus(referenceId);
  const normalized = normalizeMtnPaymentStatus(mtnStatus.status);

  // MVP: payments are inferred; we only update the order paymentStatus where possible.
  // Best-effort: if the client used `externalId = order.id` (initiate endpoint does), we can update by that.
  const externalId = (mtnStatus as { externalId?: unknown }).externalId;
  if (typeof externalId === "string") {
    await db
      .update(orders)
      .set({
        paymentStatus: normalized,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, externalId), isNull(orders.deletedAt)));
  }

  return { mtnStatus, normalized };
}

function getMtnCurrencyForOrder(orderCurrency: string): string {
  // In MTN sandbox, the API commonly expects EUR regardless of local currency.
  // Allow overriding via env without changing order pricing currency.
  return process.env.MTN_MOMO_COLLECTION_CURRENCY || orderCurrency;
}

async function assertStoreAndOrder(params: { storeSlug: string; orderId: string }) {
  const store = await db.query.stores.findFirst({
    where: and(eq(stores.slug, params.storeSlug), isNull(stores.deletedAt)),
    columns: { id: true, tenantId: true },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, params.orderId), eq(orders.storeId, store.id), isNull(orders.deletedAt)),
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return { store, order };
}

// POST /api/storefront/:slug/payments/mtn-momo/request-to-pay
mtnMomoRouter.post("/storefront/:slug/payments/mtn-momo/request-to-pay", async (req, res, next) => {
  try {
    const body = requestToPayBodySchema.parse(req.body);

    await assertStoreAndOrder({ storeSlug: req.params.slug, orderId: body.orderId });

    const result = await mtnMomoCollections.requestToPay({
      amount: body.amount,
      currency: body.currency,
      externalId: body.externalId,
      payerMsisdn: body.payerMsisdn,
      payerMessage: body.payerMessage,
      payeeNote: body.payeeNote,
      callbackUrl: body.callbackUrl,
      referenceId: body.referenceId,
    });

    return res.status(202).json({ ...result });
  } catch (err) {
    next(err);
  }
});

const initiateForOrderBodySchema = z.object({
  orderId: z.string().uuid(),
  payerMsisdn: z.string().min(1).optional(),
  payerMessage: z.string().optional(),
  payeeNote: z.string().optional(),
  callbackUrl: z.string().url().optional(),
});

// POST /api/storefront/:slug/payments/mtn-momo/initiate
// Fully wired: derives amount/currency/externalId from the order.
mtnMomoRouter.post("/storefront/:slug/payments/mtn-momo/initiate", async (req, res, next) => {
  try {
    const body = initiateForOrderBodySchema.parse(req.body);
    const { order } = await assertStoreAndOrder({ storeSlug: req.params.slug, orderId: body.orderId });

    if (!order.customerPhone && !body.payerMsisdn) {
      throw new Error("Missing payer phone number. Provide customerPhone on the order or payerMsisdn in the request.");
    }

    const result = await mtnMomoCollections.requestToPay({
      amount: String(order.totalAmount),
      currency: getMtnCurrencyForOrder(order.currency),
      externalId: order.id,
      payerMsisdn: body.payerMsisdn || order.customerPhone || "",
      payerMessage: body.payerMessage,
      payeeNote: body.payeeNote,
      callbackUrl: body.callbackUrl,
    });

    return res.status(202).json({
      referenceId: result.referenceId,
      orderId: order.id,
      paymentStatus: "pending",
    });
  } catch (err) {
    next(err);
  }
});

const statusParamsSchema = z.object({
  referenceId: z.string().min(1),
});

// GET /api/storefront/:slug/payments/mtn-momo/request-to-pay/:referenceId
mtnMomoRouter.get("/storefront/:slug/payments/mtn-momo/request-to-pay/:referenceId", async (req, res, next) => {
  try {
    const { referenceId } = statusParamsSchema.parse(req.params);
    const { mtnStatus, normalized } = await updatePaymentAndOrderFromMtnStatus(referenceId);
    return res.status(200).json({ ...mtnStatus, normalizedPaymentStatus: normalized });
  } catch (err) {
    next(err);
  }
});

const byOrderParamsSchema = z.object({
  orderId: z.string().uuid(),
});

// GET /api/storefront/:slug/payments/mtn-momo/by-order/:orderId
mtnMomoRouter.get("/storefront/:slug/payments/mtn-momo/by-order/:orderId", async (req, res, next) => {
  try {
    const { orderId } = byOrderParamsSchema.parse(req.params);
    await assertStoreAndOrder({ storeSlug: req.params.slug, orderId });
    return res.status(200).json({ orderId, payments: [] });
  } catch (err) {
    next(err);
  }
});

// MTN callbacks can be POST (v1) or PUT (v2)
async function handleWebhook(req: Request, res: Response) {
  try {
    const referenceId = req.header("x-reference-id") || undefined;
    const payload = req.body;

    console.log("[MTN MoMo Webhook] Incoming", {
      referenceId,
      hasBody: Boolean(payload),
    });

    // MTN callbacks are not always reliable (and may contain minimal payload). We treat the callback
    // as a signal to re-fetch authoritative status via the status endpoint.
    if (referenceId) {
      try {
        await updatePaymentAndOrderFromMtnStatus(referenceId);
      } catch (err) {
        console.error("[MTN MoMo Webhook] Failed to refresh status", err);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[MTN MoMo Webhook] Handler error", err);
    return res.status(200).json({ ok: true });
  }
}

mtnMomoRouter.post("/webhooks/mtn-momo", handleWebhook);
mtnMomoRouter.put("/webhooks/mtn-momo", handleWebhook);
