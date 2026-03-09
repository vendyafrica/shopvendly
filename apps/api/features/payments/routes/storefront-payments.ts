import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { z } from "zod";
import { and, db, eq, isNull, orders, stores } from "@shopvendly/db";
import { handlePaidOrderTransition } from "../services/payment-order-transition.js";

export const storefrontPaymentsRouter: ExpressRouter = Router();

const COLLECTO_REFERENCE_SEPARATOR = "::";

const collectoInitiateBodySchema = z.object({
  orderId: z.string().uuid(),
  phone: z.string().min(1),
  amount: z.number().positive(),
  reference: z.string().min(1),
});

const collectoStatusBodySchema = z.object({
  transactionId: z.string().min(1),
});

const collectoCallbackBodySchema = z.object({
  reference: z.string().optional(),
  transactionId: z.string().optional(),
  status: z.string().optional(),
});

const uuidString = z.string().uuid();

function parseCollectoReference(reference: string | null | undefined) {
  if (!reference) {
    return { storeSlug: null, orderId: null };
  }

  const [storeSlug, orderId] = reference.split(COLLECTO_REFERENCE_SEPARATOR);

  if (!storeSlug || !orderId) {
    return { storeSlug: null, orderId: null };
  }

  const parsedOrderId = uuidString.safeParse(orderId);
  if (!parsedOrderId.success) {
    return { storeSlug: null, orderId: null };
  }

  return { storeSlug, orderId: parsedOrderId.data };
}

function getCollectoMode(): "disabled" | "live" {
  const value = (process.env.COLLECTO_PAYMENT_MODE || "disabled").trim().toLowerCase();
  return value === "live" ? "live" : "disabled";
}

function isCollectoConfiguredForLive() {
  return Boolean(process.env.COLLECTO_USERNAME && process.env.COLLECTO_API_KEY);
}

function getCollectoBaseUrl() {
  return (process.env.COLLECTO_BASE_URL || "https://collecto.cissytech.com/api").replace(/\/$/, "");
}

function normalizeCollectoPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `256${digits.slice(1)}`;
  return digits;
}

function normalizeCollectoStatus(value: unknown): "pending" | "successful" | "failed" {
  if (typeof value !== "string") return "pending";
  const normalized = value.trim().toLowerCase();
  if (["success", "successful", "completed", "paid"].includes(normalized)) return "successful";
  if (["failed", "error", "cancelled", "canceled", "rejected"].includes(normalized)) return "failed";
  return "pending";
}

function getCollectoPayloadRecord(payload: Record<string, unknown>) {
  const nested = payload.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }

  return null;
}

function readCandidateMessage(payload: Record<string, unknown>): string | null {
  const nested = getCollectoPayloadRecord(payload);
  const candidates = [
    payload.message,
    payload.status_message,
    nested?.message,
    nested?.status_message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

async function collectoFetch(method: string, body: unknown) {
  const username = process.env.COLLECTO_USERNAME || "";
  if (!username) {
    throw new Error("Missing COLLECTO_USERNAME");
  }

  const response = await fetch(`${getCollectoBaseUrl()}/${username}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.COLLECTO_API_KEY || "",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text || null;
  }

  return {
    ok: response.ok,
    status: response.status,
    json,
    text,
  };
}

async function assertStoreAndOrder(storeSlug: string, orderId: string) {
  const store = await db.query.stores.findFirst({
    where: and(eq(stores.slug, storeSlug), isNull(stores.deletedAt)),
    columns: { id: true },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.storeId, store.id), isNull(orders.deletedAt)),
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}

function readCandidateStatus(payload: Record<string, unknown>): unknown {
  const nested = getCollectoPayloadRecord(payload);

  return (
    nested?.status ??
    nested?.paymentStatus ??
    nested?.transactionStatus ??
    nested?.state ??
    payload.status ??
    payload.paymentStatus ??
    payload.transactionStatus ??
    payload.state ??
    nested?.message ??
    payload.message
  );
}

function logCollectoDebug(event: string, payload: Record<string, unknown>) {
  console.info(`[Collecto] ${event}`, payload);
}

storefrontPaymentsRouter.post("/storefront/:slug/payments/collecto/initiate", async (req, res, next) => {
  try {
    if (getCollectoMode() === "disabled" || !isCollectoConfiguredForLive()) {
      return res.status(503).json({
        error: {
          code: "COLLECTO_DISABLED",
          message: "Mobile money is not enabled for this storefront.",
        },
      });
    }

    const { slug } = req.params;
    const body = collectoInitiateBodySchema.parse(req.body);
    const order = await assertStoreAndOrder(slug, body.orderId);

    if (order.paymentMethod !== "mobile_money") {
      return res.status(400).json({
        error: {
          code: "INVALID_PAYMENT_METHOD",
          message: "This order is not configured for mobile money.",
        },
      });
    }

    const reference = `${slug}${COLLECTO_REFERENCE_SEPARATOR}${order.id}`;

    logCollectoDebug("initiate:request", {
      slug,
      orderId: order.id,
      amount: body.amount,
      phone: normalizeCollectoPhone(body.phone),
      reference,
    });

    const response = await collectoFetch("requestToPay", {
      paymentOption: "mobilemoney",
      phone: normalizeCollectoPhone(body.phone),
      amount: body.amount,
      reference,
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

    logCollectoDebug("initiate:response", {
      slug,
      orderId: order.id,
      upstreamStatus: response.status,
      ok: response.ok,
      payload,
    });

    const transactionId =
      (typeof payload.transactionId === "string" && payload.transactionId) ||
      (typeof payload.id === "string" && payload.id) ||
      (typeof payload.reference === "string" && payload.reference) ||
      reference;

    return res.status(202).json({
      ok: true,
      mode: "live",
      transactionId,
      raw: response.json,
    });
  } catch (err) {
    next(err);
  }
});

storefrontPaymentsRouter.post("/storefront/:slug/payments/collecto/status", async (req, res, next) => {
  try {
    if (getCollectoMode() === "disabled" || !isCollectoConfiguredForLive()) {
      return res.status(503).json({
        error: {
          code: "COLLECTO_DISABLED",
          message: "Mobile money is not enabled for this storefront.",
        },
      });
    }

    const { slug } = req.params;
    const body = collectoStatusBodySchema.parse(req.body);

    const response = await collectoFetch("requestToPayStatus", {
      transactionId: body.transactionId,
    });

    if (!response.ok) {
      return res.status(response.status || 502).json({
        error: {
          code: "COLLECTO_STATUS_FAILED",
          message: "Failed to fetch Collecto payment status.",
          details: response.json || response.text,
        },
      });
    }

    const payload = (response.json ?? {}) as Record<string, unknown>;
    const normalizedStatus = normalizeCollectoStatus(readCandidateStatus(payload));
    const statusMessage = readCandidateMessage(payload);

    logCollectoDebug("status:response", {
      slug,
      transactionId: body.transactionId,
      upstreamStatus: response.status,
      ok: response.ok,
      normalizedStatus,
      statusMessage,
      payload,
    });

    if (normalizedStatus === "successful") {
      const reference = typeof payload.reference === "string" ? payload.reference : null;
      const { storeSlug, orderId } = parseCollectoReference(reference);
      if (storeSlug && orderId) {
        if (storeSlug !== slug) {
          return res.status(409).json({
            error: {
              code: "COLLECTO_REFERENCE_MISMATCH",
              message: "Collecto reference does not match the requested storefront.",
            },
          });
        }

        await assertStoreAndOrder(slug, orderId);
        await handlePaidOrderTransition({ orderId, paymentMethod: "mobile_money" });
      }
    }

    return res.status(200).json({
      ok: true,
      mode: "live",
      transactionId: body.transactionId,
      status: normalizedStatus,
      message: statusMessage,
      raw: response.json,
    });
  } catch (err) {
    next(err);
  }
});

storefrontPaymentsRouter.post("/payments/collecto/callback", async (req, res, next) => {
  try {
    const body = collectoCallbackBodySchema.parse(req.body ?? {});
    const { storeSlug, orderId } = parseCollectoReference(body.reference || null);
    const normalizedStatus = normalizeCollectoStatus(body.status);

    logCollectoDebug("callback:received", {
      storeSlug,
      orderId,
      transactionId: body.transactionId ?? null,
      status: body.status ?? null,
      normalizedStatus,
      body,
    });

    if (!storeSlug || !orderId) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    if (normalizedStatus === "successful") {
      await handlePaidOrderTransition({ orderId, paymentMethod: "mobile_money" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});
