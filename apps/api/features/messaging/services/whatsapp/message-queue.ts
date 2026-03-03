import crypto from "crypto";
import { whatsappClient } from "./whatsapp-client.js";

export type TemplateComponent = {
  type: string;
  parameters?: Array<Record<string, unknown>>;
};

export type TemplateMessageInput = {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: TemplateComponent[];
};

export type TextMessageOptions = {
  to: string;
  body: string;
  tenantId?: string | null;
  orderId?: string | null;
  dedupeKey?: string | null;
};

export type TemplateMessageOptions = {
  input: TemplateMessageInput;
  tenantId?: string | null;
  orderId?: string | null;
  dedupeKey?: string | null;
  type?: "template";
};

export type TemplateQueuePayload = TemplateMessageOptions & { type: "template" };

export type TextQueuePayload = TextMessageOptions & { type: "text" };

export type QueuePayload = TemplateQueuePayload | TextQueuePayload;

export type InboundMessageOptions = {
  from: string;
  to: string;
  messageBody: string;
  tenantId?: string | null;
  orderId?: string | null;
  dedupeKey?: string | null;
};

const dedupeStore = new Set<string>();

function trackDedupe(key: string | null | undefined) {
  if (!key) return;
  dedupeStore.add(key);
}

function randomId() {
  return crypto.randomBytes(8).toString("hex");
}

function shouldUseDirectSend() {
  if (process.env.WHATSAPP_DIRECT_SEND === "true") return true;
  if (process.env.WHATSAPP_USE_QSTASH === "true") return false;
  return process.env.NODE_ENV === "development";
}

async function publishToQstash(payload: QueuePayload) {
  const qstashBaseUrl = process.env.QSTASH_BASE_URL;
  const qstashToken = process.env.QSTASH_TOKEN;
  const deliveryUrl = process.env.QSTASH_DELIVERY_URL;

  if (!qstashBaseUrl || !qstashToken || !deliveryUrl) {
    console.warn("[WhatsAppQueue] Missing QStash config; payload not published", {
      hasBaseUrl: Boolean(qstashBaseUrl),
      hasToken: Boolean(qstashToken),
      hasDeliveryUrl: Boolean(deliveryUrl),
      type: payload.type,
    });
    return;
  }

  const endpoint = `${qstashBaseUrl.replace(/\/$/, "")}/v2/publish/${encodeURIComponent(deliveryUrl)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${qstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to publish WhatsApp payload to QStash: ${response.status} ${body}`);
  }
}

async function dispatchDirect(payload: QueuePayload) {
  if (payload.type === "template") {
    await whatsappClient.sendTemplateMessage(payload.input);
    return;
  }

  await whatsappClient.sendTextMessage({
    to: payload.to,
    body: payload.body,
  });
}

export async function enqueueTextMessage(payload: TextMessageOptions): Promise<{ id: string }> {
  const id = randomId();
  trackDedupe(payload.dedupeKey);
  const queuePayload: TextQueuePayload = { ...payload, type: "text" };
  console.info("[WhatsAppQueue] Enqueue text", { id, ...queuePayload });

  if (shouldUseDirectSend()) {
    console.info("[WhatsAppQueue] Direct send mode (text)", { id });
    await dispatchDirect(queuePayload);
    return { id };
  }

  try {
    await publishToQstash(queuePayload);
  } catch (error) {
    console.error("[WhatsAppQueue] QStash publish failed for text; falling back to direct send", { id, error });
    await dispatchDirect(queuePayload);
  }
  return { id };
}

export async function enqueueTemplateMessage(payload: TemplateMessageOptions): Promise<{ id: string }> {
  const id = randomId();
  trackDedupe(payload.dedupeKey);
  const queuePayload: TemplateQueuePayload = { ...payload, type: "template" };
  console.info("[WhatsAppQueue] Enqueue template", { id, ...queuePayload });

  if (shouldUseDirectSend()) {
    console.info("[WhatsAppQueue] Direct send mode (template)", { id });
    await dispatchDirect(queuePayload);
    return { id };
  }

  try {
    await publishToQstash(queuePayload);
  } catch (error) {
    console.error("[WhatsAppQueue] QStash publish failed for template; falling back to direct send", { id, error });
    await dispatchDirect(queuePayload);
  }
  return { id };
}

export async function enqueueInboundMessage(payload: InboundMessageOptions): Promise<{ id: string }> {
  const id = randomId();
  trackDedupe(payload.dedupeKey);
  console.info("[WhatsAppQueue] Enqueue inbound", { id, ...payload });
  return { id };
}

export async function hasDedupeKey(key: string): Promise<boolean> {
  return dedupeStore.has(key);
}

export function clearDedupeStore() {
  dedupeStore.clear();
}
