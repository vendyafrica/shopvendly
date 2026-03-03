import type { TemplateMessageInput } from "./message-queue.js";

type SendTextMessageInput = {
  to: string;
  body: string;
};

function getMetaConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";
  return {
    accessToken,
    phoneNumberId,
    graphVersion,
    enabled: Boolean(accessToken && phoneNumberId),
  };
}

function normalizeRecipient(to: string) {
  return to.replace(/^\+/, "");
}

async function postMetaMessage(payload: Record<string, unknown>) {
  const config = getMetaConfig();
  if (!config.enabled || !config.accessToken || !config.phoneNumberId) {
    console.warn("[WhatsAppClient] Missing Meta Cloud API config, skipping direct send", {
      hasAccessToken: Boolean(config.accessToken),
      hasPhoneNumberId: Boolean(config.phoneNumberId),
    });
    return { messageId: `wa-missing-config-${Date.now()}`, status: "queued" as const };
  }

  const url = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[WhatsAppClient] Meta send failed", {
      status: res.status,
      payload,
      response: json,
    });
    throw new Error(`Meta WhatsApp send failed (${res.status})`);
  }

  const messageId =
    ((json as { messages?: Array<{ id?: string }> }).messages?.[0]?.id ??
      `wa-meta-${Date.now()}`);
  return { messageId, status: "sent" as const };
}

function normalizeTemplateComponents(input: TemplateMessageInput) {
  return input.components?.map((component) => ({
    type: component.type,
    parameters: component.parameters?.map((parameter) => {
      if (typeof parameter === "object" && parameter !== null && "type" in parameter) {
        return parameter;
      }

      if (typeof parameter === "object" && parameter !== null && "text" in parameter) {
        return {
          type: "text",
          text: String((parameter as { text?: unknown }).text ?? ""),
        };
      }

      return {
        type: "text",
        text: String(parameter ?? ""),
      };
    }),
  }));
}

export const whatsappClient = {
  async sendTextMessage({ to, body }: SendTextMessageInput) {
    const normalizedTo = normalizeRecipient(to);
    console.info("[WhatsAppClient] Sending text message", { to: normalizedTo, bodyLength: body?.length ?? 0 });

    return postMetaMessage({
      to: normalizedTo,
      type: "text",
      text: { body },
    });
  },

  async sendTemplateMessage(input: TemplateMessageInput) {
    const normalizedTo = normalizeRecipient(input.to);
    const components = normalizeTemplateComponents(input);
    console.info("[WhatsAppClient] Sending template message", {
      to: normalizedTo,
      templateName: input.templateName,
      languageCode: input.languageCode,
      componentsCount: components?.length ?? 0,
    });

    return postMetaMessage({
      to: normalizedTo,
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.languageCode || "en_US" },
        components,
      },
    });
  },
};
