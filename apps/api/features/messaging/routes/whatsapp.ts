import crypto from "crypto";
import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import type { RawBodyRequest } from "../../../shared/types/raw-body.js";
import { orderService } from "../../orders/services/order-service.js";
import { enqueueInboundMessage, enqueueTextMessage, hasDedupeKey } from "../../messaging/services/whatsapp/message-queue.js";
import { handlePaidOrderTransition } from "../../payments/services/payment-order-transition.js";
import {
  notifyCustomerOrderAccepted,
  notifyCustomerOrderReady,
  notifyCustomerOutForDelivery,
  notifyCustomerOrderDelivered,
  notifyCustomerOrderDeclined,
  notifySellerMarkReady,
  notifySellerOutForDelivery,
  notifySellerOrderCompleted,
} from "../../messaging/services/notifications.js";

export const whatsappRouter: ExpressRouter = Router();

// GET /api/webhooks/whatsapp (Meta verification)
whatsappRouter.get("/webhooks/whatsapp", (req, res) => {
  const modeRaw = req.query["hub.mode"];
  const tokenRaw = req.query["hub.verify_token"];
  const challengeRaw = req.query["hub.challenge"];

  const mode = Array.isArray(modeRaw) ? modeRaw[0] : modeRaw;
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;
  const challenge = Array.isArray(challengeRaw) ? challengeRaw[0] : challengeRaw;

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  console.log("[WhatsApp Verify]", {
    mode,
    token,
    challenge,
    hasVerifyToken: Boolean(verifyToken),
    tokenMatches: Boolean(verifyToken && token && String(token) === String(verifyToken)),
  });

  if (mode === "subscribe" && verifyToken && token && String(token) === String(verifyToken)) {
    return res.status(200).send(String(challenge || ""));
  }

  return res.sendStatus(403);
});

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

const BYPASS_SIGNATURE = process.env.WHATSAPP_BYPASS_SIGNATURE === "true" || process.env.NODE_ENV === "development";

function verifySignature(req: RawBodyRequest): boolean {
  if (BYPASS_SIGNATURE) {
    return true;
  }

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return false;

  const signature = req.header("x-hub-signature-256") || "";
  const raw = req.rawBody;
  if (!raw) return false;

  const hash = crypto.createHmac("sha256", appSecret).update(raw).digest("hex");
  const expected = `sha256=${hash}`;

  return timingSafeEqual(signature, expected);
}

function asObject(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "object" || v === null) return null;
  return v as Record<string, unknown>;
}

// POST /api/webhooks/whatsapp (incoming events)
whatsappRouter.post("/webhooks/whatsapp", async (req, res) => {
  // Meta expects 200 quickly. We log now; later we can enqueue to DB/outbox.
  const rawReq = req as RawBodyRequest;
  const signatureHeader = req.header("x-hub-signature-256") || "";
  const hasRawBody = Boolean(rawReq.rawBody);
  const rawLen = rawReq.rawBody ? rawReq.rawBody.length : 0;
  const hasAppSecret = Boolean(process.env.WHATSAPP_APP_SECRET);

  const ok = verifySignature(rawReq);
  console.log("[WhatsAppWebhook] Incoming", {
    path: req.path,
    hasSignatureHeader: Boolean(signatureHeader),
    hasRawBody,
    rawLen,
    hasAppSecret,
    signatureOk: ok,
    bypassSignature: BYPASS_SIGNATURE,
  });

  if (!ok) {
    console.warn("[WhatsAppWebhook] Signature failed; returning 403", { hasSignatureHeader: Boolean(signatureHeader), hasRawBody, rawLen });
    return res.sendStatus(403);
  }

  const payload: unknown = req.body;

  try {
    const payloadObj = asObject(payload);
    const entry = (payloadObj?.entry as unknown as unknown[] | undefined)?.[0];
    const entryObj = asObject(entry);
    const changes = (entryObj?.changes as unknown as unknown[] | undefined)?.[0];
    const changesObj = asObject(changes);
    const value = asObject(changesObj?.value);
    const messages = (value?.messages as unknown as unknown[] | undefined)?.[0];
    const message = asObject(messages);
    if (!message) {
      return res.sendStatus(200);
    }

    const from = typeof message.from === "string" ? message.from : undefined;
    if (!from) {
      return res.sendStatus(200);
    }

    const messageId = typeof message.id === "string" ? message.id : null;
    const inboundDedupeKey = messageId ? `inbound:${messageId}` : null;
    if (inboundDedupeKey) {
      if (await hasDedupeKey(inboundDedupeKey)) {
        return res.sendStatus(200);
      }
    }

    // Meta webhooks can send:
    // - type: "button" with message.button.text
    // - type: "interactive" with message.interactive.button_reply.title
    // - type: "text" with message.text.body
    const type = typeof message.type === "string" ? message.type : undefined;

    const textBody =
      (type === "text" ? (asObject(message.text)?.body as string | undefined) : undefined) ||
      (type === "button" ? (asObject(message.button)?.text as string | undefined) : undefined) ||
      (type === "interactive"
        ? ((asObject(asObject(message.interactive)?.button_reply)?.title as string | undefined) ?? undefined)
        : undefined);

    const raw = String(textBody || "").trim();
    if (!raw) {
      return res.sendStatus(200);
    }

    console.log("[WhatsAppWebhook] Message", { from, type, raw, messageId });

    const normalized = raw.toLowerCase().trim();

    // -----------------------------------------------------------------------
    // Buyer "I PAID" quick reply — sender is NOT a tenant (seller)
    // -----------------------------------------------------------------------
    if (normalized === "i paid") {
      // Look up the latest pending-payment order for this buyer phone
      const buyerOrder = await orderService.getLatestOrderByCustomerPhone(from, ["pending"]);
      if (!buyerOrder) {
        await enqueueInboundMessage({
          from,
          to: "vendly",
          messageBody: raw,
          dedupeKey: inboundDedupeKey ?? undefined,
        });
        await enqueueTextMessage({
          to: from,
          body: "We could not find a pending order for your number. If you have paid, please wait for confirmation.",
          dedupeKey: `customer:paid:missing:${from}`,
        });
        return res.sendStatus(200);
      }

      await enqueueInboundMessage({
        from,
        to: "vendly",
        messageBody: raw,
        tenantId: buyerOrder.tenantId,
        orderId: buyerOrder.id,
        dedupeKey: inboundDedupeKey ?? undefined,
      });

      try {
        await handlePaidOrderTransition({
          orderId: buyerOrder.id,
          includeSellerContext: true,
        });
      } catch (err) {
        console.error("[WhatsAppWebhook] Failed paid-order transition after I PAID", err);
      }

      return res.sendStatus(200);
    }

    const commandToken = normalized.split(/\s+/).filter(Boolean)[0] || "";
    const normalizedCommand = commandToken.replace(/[^a-z]/g, "");

    // -----------------------------------------------------------------------
    // Buyer command: RECEIVED ✅ marks completed + paid
    // -----------------------------------------------------------------------
    if (normalizedCommand === "received") {
      const buyerOrder = await orderService.getLatestOrderByCustomerPhone(from, ["pending", "paid"]);
      if (!buyerOrder) {
        await enqueueInboundMessage({
          from,
          to: "vendly",
          messageBody: raw,
          dedupeKey: inboundDedupeKey ?? undefined,
        });
        await enqueueTextMessage({
          to: from,
          body: "We could not find an active order to mark as received. Please include your order number if possible.",
          dedupeKey: `customer:received:missing:${from}`,
        });
        return res.sendStatus(200);
      }

      await enqueueInboundMessage({
        from,
        to: "vendly",
        messageBody: raw,
        tenantId: buyerOrder.tenantId,
        orderId: buyerOrder.id,
        dedupeKey: inboundDedupeKey ?? undefined,
      });

      await orderService.updateOrderStatusByOrderId(buyerOrder.id, {
        status: "completed",
        paymentStatus: "paid",
      });

      try {
        const full = await orderService.getOrderById(buyerOrder.id);
        if (full) {
          await notifyCustomerOrderDelivered({ order: full });
        }
      } catch (err) {
        console.error("[WhatsAppWebhook] Failed to notify customer (received)", err);
      }

      return res.sendStatus(200);
    }

    // -----------------------------------------------------------------------
    // Seller commands: ACCEPT, DECLINE, READY, OUT, DELIVERED, DONE ✅
    // -----------------------------------------------------------------------
    const tenantId = await orderService.getTenantIdByPhoneNumber(from);
    if (!tenantId) {
      const buyerOrder = await orderService.getLatestOrderByCustomerPhone(from, ["pending"]);
      if (!buyerOrder) {
        console.warn("[WhatsAppWebhook] Could not map sender to tenant or buyer order", { from, raw });
        await enqueueInboundMessage({
          from,
          to: "vendly",
          messageBody: raw,
          dedupeKey: inboundDedupeKey ?? undefined,
        });
        return res.sendStatus(200);
      }

      await enqueueInboundMessage({
        from,
        to: "vendly",
        messageBody: raw,
        tenantId: buyerOrder.tenantId,
        orderId: buyerOrder.id,
        dedupeKey: inboundDedupeKey ?? undefined,
      });
      await enqueueTextMessage({
        to: from,
        body: `📌 Thanks for your order ${buyerOrder.orderNumber}! We are waiting for the seller to accept it. You will receive delivery updates once accepted.`,
        tenantId: buyerOrder.tenantId,
        orderId: buyerOrder.id,
        dedupeKey: `customer:pending:status:${buyerOrder.id}:${from}`,
      });
      return res.sendStatus(200);
    }

    const parts = normalized.split(/\s+/).filter(Boolean);
    const actionToken = parts[0] || "";
    const actionNormalized = actionToken.replace(/[^a-z]/g, "");
    const action = actionNormalized === "done"
      ? "out"
      : actionNormalized === "received"
        ? "delivered"
        : actionNormalized;
    const maybeOrderNumber = parts.find((p: string) => p.startsWith("ord-"));

    const order = maybeOrderNumber
      ? await orderService.getOrderByOrderNumberForTenant(tenantId, maybeOrderNumber.toUpperCase())
      : action === "ready"
        ? await orderService.getLatestOrderForTenantByStatus(tenantId, ["processing", "paid_processing"])
        : action === "out"
          ? await orderService.getLatestOrderForTenantByStatus(tenantId, ["ready"])
          : action === "delivered"
            ? await orderService.getLatestOrderForTenantByStatus(tenantId, ["out_for_delivery"])
            : await orderService.getLatestOrderForTenantByStatus(tenantId, ["pending_seller_acceptance", "pending"]);

    if (!order) {
      await enqueueInboundMessage({
        from,
        to: "vendly",
        messageBody: raw,
        tenantId,
        dedupeKey: inboundDedupeKey ?? undefined,
      });
      await enqueueTextMessage({
        to: from,
        body: "No matching order found. Reply like: ACCEPT ORD-0001, DECLINE ORD-0001, READY ORD-0001, DONE ✅ ORD-0001, OUT ORD-0001, or DELIVERED ORD-0001.",
        tenantId,
        dedupeKey: `seller:no_order:${tenantId}:${from}`,
      });
      return res.sendStatus(200);
    }

    await enqueueInboundMessage({
      from,
      to: "vendly",
      messageBody: raw,
      tenantId,
      orderId: order.id,
      dedupeKey: inboundDedupeKey ?? undefined,
    });

    const sellerPhone = await orderService.getTenantPhoneByTenantId(tenantId);

    if (action === "accept") {
      await orderService.updateOrderStatus(order.id, tenantId, { status: "awaiting_payment" });

      // Seller accepted: notify buyer that order has been accepted.
      try {
        const full = await orderService.getOrderById(order.id);
        if (full) {
          await notifyCustomerOrderAccepted({ order: full });
        }
      } catch (err) {
        console.error("[WhatsAppWebhook] Failed to notify customer (accepted)", err);
      }
      return res.sendStatus(200);
    }

    if (action === "decline") {
      await orderService.updateOrderStatus(order.id, tenantId, { status: "cancelled" });

      // Notify buyer their order was declined
      try {
        const full = await orderService.getOrderById(order.id);
        if (full) {
          await notifyCustomerOrderDeclined({ order: full });
        }
      } catch (err) {
        console.error("[WhatsAppWebhook] Failed to notify customer (declined)", err);
      }

      await enqueueTextMessage({
        to: from,
        body: `Declined ${order.orderNumber}.`,
        tenantId,
        orderId: order.id,
        dedupeKey: `seller:declined:ack:${order.id}:${from}`,
      });
      return res.sendStatus(200);
    }

    if (action === "ready") {
      await orderService.updateOrderStatus(order.id, tenantId, { status: "ready" });

      try {
        const full = await orderService.getOrderById(order.id);
        if (full) {
          await notifySellerMarkReady({ sellerPhone, order: full });
          await notifyCustomerOrderReady({ order: full });
        }
      } catch (err) {
        console.error("[WhatsAppWebhook] Failed to send ready notifications", err);
      }
      return res.sendStatus(200);
    }

    if (action === "out") {
      await orderService.updateOrderStatus(order.id, tenantId, { status: "out_for_delivery" });

      const riderDetails = "Vendly Rider (+256700000000)";
      try {
        const full = await orderService.getOrderById(order.id);
        if (full) {
          await notifySellerOutForDelivery({ sellerPhone, order: full, riderDetails });
          await notifyCustomerOutForDelivery({ order: full, riderDetails });
        }
      } catch (err) {
        console.error("[WhatsAppWebhook] Failed to send out-for-delivery notifications", err);
      }
      return res.sendStatus(200);
    }

    if (action === "delivered") {
      await orderService.updateOrderStatus(order.id, tenantId, { status: "completed", paymentStatus: "paid" });

      try {
        const full = await orderService.getOrderById(order.id);
        if (full) {
          await notifySellerOrderCompleted({ sellerPhone, order: full });
          await notifyCustomerOrderDelivered({ order: full });
        }
      } catch (err) {
        console.error("[WhatsAppWebhook] Failed to send delivered notifications", err);
      }
      return res.sendStatus(200);
    }

    await enqueueTextMessage({
      to: from,
      body: "Unknown command. Reply: ACCEPT, DECLINE, READY, DONE ✅, OUT, or DELIVERED (optionally with order number).",
      tenantId,
      dedupeKey: `seller:unknown:${tenantId}:${from}`,
    });
  } catch (err) {
    console.error("[WhatsAppWebhook] Handler error", err);
  }

  return res.sendStatus(200);
});
