import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { Receiver } from "@upstash/qstash";
import type { RawBodyRequest } from "../shared/types/raw-body";
import { whatsappClient } from "../../messaging/services/whatsapp/whatsapp-client";
import type { QueuePayload } from "../../messaging/services/whatsapp/message-queue";

export const whatsappDeliveryRouter: ExpressRouter = Router();

function getReceiver() {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) return null;
  return new Receiver({ currentSigningKey, nextSigningKey });
}

whatsappDeliveryRouter.post("/webhooks/qstash/whatsapp", async (req, res) => {
  const receiver = getReceiver();
  const deliveryUrl = process.env.QSTASH_DELIVERY_URL;
  if (!receiver || !deliveryUrl) {
    console.warn("[QStash] Missing signing keys or QSTASH_DELIVERY_URL");
    return res.sendStatus(500);
  }

  const signature = req.header("Upstash-Signature") || req.header("upstash-signature") || "";
  const rawBody = (req as RawBodyRequest).rawBody?.toString("utf8") ?? JSON.stringify(req.body ?? {});

  const isValid = await receiver.verify({
    body: rawBody,
    signature,
    url: deliveryUrl,
  });

  if (!isValid) {
    console.warn("[QStash] Invalid signature");
    return res.sendStatus(403);
  }

  const payload = req.body as QueuePayload;
  try {
    let result: unknown;
    if (payload.type === "template") {
      result = await whatsappClient.sendTemplateMessage({
        to: payload.to,
        templateName: payload.templateName || "",
        languageCode: payload.languageCode || "en_US",
        components: payload.components ?? undefined,
      });
    } else {
      result = await whatsappClient.sendTextMessage({
        to: payload.to,
        body: payload.body || "",
      });
    }

    console.log("[QStash] Delivery success", {
      type: payload.type,
      to: payload.to,
      template: payload.templateName,
      orderId: payload.orderId,
      tenantId: payload.tenantId,
      dedupeKey: payload.dedupeKey,
      result,
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error("[QStash] Delivery failed", {
      error,
      type: payload.type,
      to: payload.to,
      template: payload.templateName,
      orderId: payload.orderId,
      tenantId: payload.tenantId,
      dedupeKey: payload.dedupeKey,
    });
    return res.sendStatus(500);
  }
});
