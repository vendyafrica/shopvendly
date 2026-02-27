import crypto from "crypto";

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

export async function enqueueTextMessage(payload: TextMessageOptions): Promise<{ id: string }> {
  const id = randomId();
  trackDedupe(payload.dedupeKey);
  console.info("[WhatsAppQueue] Enqueue text", { id, ...payload });
  return { id };
}

export async function enqueueTemplateMessage(payload: TemplateMessageOptions): Promise<{ id: string }> {
  const id = randomId();
  trackDedupe(payload.dedupeKey);
  console.info("[WhatsAppQueue] Enqueue template", { id, ...payload });
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
