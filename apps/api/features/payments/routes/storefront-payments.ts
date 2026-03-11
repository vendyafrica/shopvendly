import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { z } from "zod";
import { and, db, eq, isNull, orders, stores } from "@shopvendly/db";
import { handleFailedOrderTransition, handlePaidOrderTransition } from "../services/payment-order-transition.js";
import {
  isCollectoFailureMessage,
  normalizeCollectoBusinessStatus,
  readCollectoBooleanFlag,
  readCollectoMessage,
  readCollectoReference,
  readCollectoStatus,
  readCollectoTransactionId,
} from "../services/collecto-payload.js";
import { updateCollectoCollectionState } from "../services/collecto-settlement.js";
import { orderService } from "../../orders/services/order-service.js";
import { collectoApiFetch, getCollectoBaseUrl } from "./collecto-http.js";

export const storefrontPaymentsRouter: ExpressRouter = Router();

const COLLECTO_REFERENCE_SEPARATOR = "::";

const collectoVerifyPhoneBodySchema = z.object({
  phone: z.string().min(1),
});

const collectoInitiateBodySchema = z.object({
  orderId: z.string().uuid(),
  phone: z.string().min(1),
});

const collectoStatusBodySchema = z.object({
  transactionId: z.string().min(1),
  orderId: z.string().uuid().optional(),
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

function normalizeCollectoPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `256${digits.slice(1)}`;
  return digits;
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

function isUsableCollectoTransactionId(transactionId: string | null): transactionId is string {
  if (!transactionId) return false;
  const normalized = transactionId.trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "null" && normalized !== "undefined";
}

function buildCollectoSoftFallback(message?: string | null) {
  return {
    recoverable: true,
    suggestedPaymentMethod: "cash_on_delivery" as const,
    message:
      message?.trim() ||
      "Mobile money is unavailable right now. Please use Cash on Delivery.",
  };
}

function logCollectoDebug(event: string, payload: Record<string, unknown>) {
  console.info(`[Collecto] ${event}`, payload);
}

function getCollectoNestedObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function readCollectoVerifiedName(payload: Record<string, unknown>) {
  const levelOne = getCollectoNestedObject(payload.data);
  const levelTwo = getCollectoNestedObject(levelOne?.data);
  const candidates = [
    levelTwo?.registeredName,
    levelTwo?.name,
    levelTwo?.accountName,
    levelTwo?.customerName,
    levelTwo?.fullName,
    levelOne?.registeredName,
    levelOne?.name,
    levelOne?.accountName,
    levelOne?.customerName,
    levelOne?.fullName,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

storefrontPaymentsRouter.post("/storefront/:slug/payments/collecto/verify-phone", async (req, res, next) => {
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
    const body = collectoVerifyPhoneBodySchema.parse(req.body);
    const phone = normalizeCollectoPhone(body.phone);

    logCollectoDebug("verify:request", {
      slug,
      phone,
      collectoBaseUrl: getCollectoBaseUrl(),
    });

    let response;
    try {
      response = await collectoApiFetch("verifyPhoneNumber", { phone }, { timeoutMs: 4000 });
    } catch (error) {
      console.error("[Collecto] verify:exception", {
        slug,
        phone,
        collectoBaseUrl: getCollectoBaseUrl(),
        error,
      });
      return res.status(200).json({
        ok: false,
        valid: false,
        phone,
        message:
          "We couldn't verify this mobile money number quickly enough. Please try again or use Cash on Delivery.",
      });
    }

    const payload = (response.json ?? {}) as Record<string, unknown>;
    const message = readCollectoMessage(payload);
    const name = readCollectoVerifiedName(payload);
    const verificationFlag = readCollectoBooleanFlag(payload, ["verifyPhoneNumber"]);
    const valid =
      response.ok &&
      verificationFlag === true &&
      Boolean(name) &&
      normalizeCollectoBusinessStatus(readCollectoStatus(payload)) !== "failed" &&
      !isCollectoFailureMessage(message);

    logCollectoDebug("verify:response", {
      slug,
      phone,
      upstreamStatus: response.status,
      ok: response.ok,
      valid,
      message,
      name,
      verificationFlag,
      payload,
    });

    return res.status(200).json({
      ok: valid,
      valid,
      phone,
      name,
      message:
        message ||
        (valid
          ? name
            ? `Verified mobile money number: ${name}.`
            : "Mobile money number verified."
          : "We couldn't verify this mobile money number."),
      raw: response.json,
    });
  } catch (err) {
    next(err);
  }
});

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

    await orderService.updateOrderStatusByOrderId(order.id, {
      status: "awaiting_payment",
      paymentMethod: "mobile_money",
      paymentStatus: "pending",
    });

    const reference = `${slug}${COLLECTO_REFERENCE_SEPARATOR}${order.id}`;
    const phone = normalizeCollectoPhone(body.phone);

    logCollectoDebug("initiate:request", {
      slug,
      orderId: order.id,
      amount: order.totalAmount,
      phone,
      reference,
      collectoBaseUrl: getCollectoBaseUrl(),
    });

    let response;
    try {
      response = await collectoApiFetch(
        "requestToPay",
        {
          paymentOption: "mobilemoney",
          phone,
          amount: order.totalAmount,
          reference,
        },
        { timeoutMs: 8000 },
      );
    } catch (error) {
      console.error("[Collecto] initiate:exception", {
        slug,
        orderId: order.id,
        amount: order.totalAmount,
        phone,
        reference,
        collectoBaseUrl: getCollectoBaseUrl(),
        error,
      });
      await updateCollectoCollectionState({
        orderId: order.id,
        reference,
        status: "failed",
        message: "Mobile money did not respond in time.",
      });
      return res.status(200).json({
        ok: false,
        error: {
          code: "COLLECTO_INITIATE_TIMEOUT",
          message: "We couldn't get a payment prompt within 8 seconds.",
        },
        fallback: buildCollectoSoftFallback(
          "Mobile money did not respond in time. Please use Cash on Delivery.",
        ),
      });
    }

    logCollectoDebug("initiate:response", {
      slug,
      orderId: order.id,
      status: response.status,
      ok: response.ok,
      body: response.json,
    });

    if (!response.ok) {
      await updateCollectoCollectionState({
        orderId: order.id,
        reference,
        status: "failed",
        message: "Mobile money is unavailable right now. Please use Cash on Delivery.",
      });
      await handleFailedOrderTransition({
        orderId: order.id,
        paymentMethod: "mobile_money",
      });
      return res.status(200).json({
        ok: false,
        error: {
          code: "COLLECTO_INITIATE_FAILED",
          message: "Mobile money is unavailable right now. Please use Cash on Delivery.",
          details: response.json || response.text,
        },
        fallback: buildCollectoSoftFallback(),
      });
    }

    const payload = (response.json ?? {}) as Record<string, unknown>;
    const transactionId = readCollectoTransactionId(payload);
    const requestToPay = readCollectoBooleanFlag(payload, ["requestToPay"]);
    const statusMessage = readCollectoMessage(payload);
    const normalizedInitiateStatus = normalizeCollectoBusinessStatus(readCollectoStatus(payload));

    if (
      !isUsableCollectoTransactionId(transactionId) ||
      requestToPay === false ||
      normalizedInitiateStatus === "failed" ||
      isCollectoFailureMessage(statusMessage)
    ) {
      await updateCollectoCollectionState({
        orderId: order.id,
        reference,
        transactionId,
        status: "failed",
        message:
          statusMessage ||
          "Mobile money is unavailable right now. Please use Cash on Delivery.",
      });
      await handleFailedOrderTransition({
        orderId: order.id,
        paymentMethod: "mobile_money",
      });
      return res.status(200).json({
        ok: false,
        error: {
          code: "COLLECTO_INITIATE_UNAVAILABLE",
          message:
            statusMessage ||
            "Mobile money is unavailable right now. Please use Cash on Delivery.",
          details: response.json || response.text,
        },
        fallback: {
          recoverable: true,
          suggestedPaymentMethod: "cash_on_delivery",
          message:
            statusMessage ||
            "Mobile money is unavailable right now. Please use Cash on Delivery.",
        },
      });
    }

    await updateCollectoCollectionState({
      orderId: order.id,
      reference,
      transactionId,
      status: "pending",
      message: statusMessage || "Awaiting customer confirmation.",
    });

    return res.status(202).json({
      ok: true,
      mode: "live",
      status: "awaiting_customer",
      transactionId,
      reference,
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

    logCollectoDebug("status:request", {
      slug,
      transactionId: body.transactionId,
      collectoBaseUrl: getCollectoBaseUrl(),
    });

    let response;
    try {
      response = await collectoApiFetch(
        "requestToPayStatus",
        {
          transactionId: body.transactionId,
        },
        { timeoutMs: 12000 },
      );
    } catch (error) {
      console.error("[Collecto] status:exception", {
        slug,
        transactionId: body.transactionId,
        orderId: body.orderId ?? null,
        collectoBaseUrl: getCollectoBaseUrl(),
        error,
      });

      const existingOrder = body.orderId ? await orderService.getOrderById(body.orderId).catch(() => null) : null;
      if (existingOrder?.paymentStatus === "paid") {
        return res.status(200).json({
          ok: true,
          mode: "live",
          transactionId: body.transactionId,
          status: "successful",
          message: "Payment already confirmed successfully.",
        });
      }

      return res.status(200).json({
        ok: true,
        mode: "live",
        transactionId: body.transactionId,
        status: "pending",
        message: "We are still confirming your payment. Please keep this page open for a moment.",
      });
    }

    if (!response.ok) {
      const existingOrder = body.orderId ? await orderService.getOrderById(body.orderId).catch(() => null) : null;
      if (existingOrder?.paymentStatus === "paid") {
        return res.status(200).json({
          ok: true,
          mode: "live",
          transactionId: body.transactionId,
          status: "successful",
          message: "Payment already confirmed successfully.",
          raw: response.json,
        });
      }

      return res.status(response.status || 502).json({
        error: {
          code: "COLLECTO_STATUS_FAILED",
          message: "Failed to fetch Collecto payment status.",
          details: response.json || response.text,
        },
      });
    }

    const payload = (response.json ?? {}) as Record<string, unknown>;
    const statusMessage = readCollectoMessage(payload);
    const normalizedStatus =
      normalizeCollectoBusinessStatus(readCollectoStatus(payload)) === "pending" &&
      isCollectoFailureMessage(statusMessage)
        ? "failed"
        : normalizeCollectoBusinessStatus(readCollectoStatus(payload));

    logCollectoDebug("status:response", {
      slug,
      transactionId: body.transactionId,
      upstreamStatus: response.status,
      ok: response.ok,
      normalizedStatus,
      statusMessage,
      payload,
    });

    const reference = readCollectoReference(payload);
    const { storeSlug, orderId: referenceOrderId } = parseCollectoReference(reference);
    const fallbackOrderId = body.orderId ?? null;
    const resolvedOrderId = referenceOrderId ?? fallbackOrderId;
    const resolvedStoreSlug = storeSlug ?? (resolvedOrderId ? slug : null);

    if (resolvedOrderId && resolvedStoreSlug === slug) {
      await updateCollectoCollectionState({
        orderId: resolvedOrderId,
        reference,
        transactionId: body.transactionId,
        status: normalizedStatus,
        message: statusMessage,
      });
    }

    if (normalizedStatus === "successful") {
      if (resolvedStoreSlug && resolvedOrderId) {
        if (resolvedStoreSlug !== slug) {
          return res.status(409).json({
            error: {
              code: "COLLECTO_REFERENCE_MISMATCH",
              message: "Collecto reference does not match the requested storefront.",
            },
          });
        }

        await assertStoreAndOrder(slug, resolvedOrderId);
        await handlePaidOrderTransition({
          orderId: resolvedOrderId,
          paymentMethod: "mobile_money",
          includeSellerContext: true,
        });
      }
    }

    if (normalizedStatus === "failed" && resolvedStoreSlug && resolvedOrderId && resolvedStoreSlug === slug) {
      await assertStoreAndOrder(slug, resolvedOrderId);
      await handleFailedOrderTransition({
        orderId: resolvedOrderId,
        paymentMethod: "mobile_money",
      });
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
    const normalizedStatus = normalizeCollectoBusinessStatus(body.status);

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

    await updateCollectoCollectionState({
      orderId,
      reference: body.reference ?? null,
      transactionId: body.transactionId ?? null,
      status: normalizedStatus,
      message: body.status ?? null,
    });

    if (normalizedStatus === "successful") {
      await handlePaidOrderTransition({
        orderId,
        paymentMethod: "mobile_money",
        includeSellerContext: true,
      });
    }

    if (normalizedStatus === "failed") {
      await handleFailedOrderTransition({
        orderId,
        paymentMethod: "mobile_money",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});
