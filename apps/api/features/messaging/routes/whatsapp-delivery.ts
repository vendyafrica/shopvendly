import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { Receiver } from "@upstash/qstash";
import type { RawBodyRequest } from "../../../shared/types/raw-body";
import { whatsappClient } from "../services/whatsapp/whatsapp-client";
import type { QueuePayload } from "../services/whatsapp/message-queue";

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
      const input = payload.input;
      result = await whatsappClient.sendTemplateMessage({
        to: input.to,
        templateName: input.templateName || "",
        languageCode: input.languageCode || "en_US",
        components: input.components ?? undefined,
      });
    } else {
      result = await whatsappClient.sendTextMessage({
        to: payload.to,
        body: payload.body || "",
      });
    }

    const to = payload.type === "template" ? payload.input.to : payload.to;
    const templateName = payload.type === "template" ? payload.input.templateName : undefined;
    console.log("[QStash] Delivery success", {
      type: payload.type,
      to,
      template: templateName,
      orderId: payload.orderId,
      tenantId: payload.tenantId,
      dedupeKey: payload.dedupeKey,
      result,
    });

    return res.sendStatus(200);
  } catch (error) {
    const to = payload.type === "template" ? payload.input.to : payload.to;
    const templateName = payload.type === "template" ? payload.input.templateName : undefined;
    console.error("[QStash] Delivery failed", {
      error,
      type: payload.type,
      to,
      template: templateName,
      orderId: payload.orderId,
      tenantId: payload.tenantId,
      dedupeKey: payload.dedupeKey,
    });
    return res.sendStatus(500);
  }
});
