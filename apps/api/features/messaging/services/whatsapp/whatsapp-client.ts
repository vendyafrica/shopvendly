import type { TemplateMessageInput } from "./message-queue";

type SendTextMessageInput = {
  to: string;
  body: string;
};

export const whatsappClient = {
  async sendTextMessage({ to, body }: SendTextMessageInput) {
    const messageId = `wa-text-${Date.now()}`;
    console.info("[WhatsAppClient] Sending text message", { to, bodyLength: body?.length ?? 0, messageId });
    return { messageId, status: "queued" } as const;
  },

  async sendTemplateMessage(input: TemplateMessageInput) {
    const messageId = `wa-template-${Date.now()}`;
    console.info("[WhatsAppClient] Sending template message", {
      to: input.to,
      templateName: input.templateName,
      languageCode: input.languageCode,
      componentsCount: input.components?.length ?? 0,
      messageId,
    });
    return { messageId, status: "queued" } as const;
  },
};
