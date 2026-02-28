import type { TemplateMessageInput } from "./message-queue";

export const TEMPLATE_NAMES = [
  "seller_new_order",
  "buyer_order_received",
  "buyer_order_ready",
  "buyer_out_for_delivery",
  "buyer_order_delivered",
  "buyer_order_declined",
] as const;

type BuyerOrderBase = {
  buyerName?: string | null;
  storeName?: string | null;
};

type SellerOrderBase = {
  sellerName?: string | null;
  orderId?: string | null;
  buyerName?: string | null;
};

type WithOrderNumber = {
  orderItems?: string | null;
  customerPhone?: string | null;
  customerLocation?: string | null;
  total?: string | number | null;
};

type WithLink = {
  sellerWhatsappLink?: string | null;
};

type OutForDelivery = {
  riderDetails?: string | null;
};

type BuildTemplateArgs<T> = T;

function bodyText(text: string): TemplateMessageInput {
  return {
    to: "",
    templateName: "",
    languageCode: "en_US",
    components: [
      {
        type: "body",
        parameters: [{ text }],
      },
    ],
  };
}

export const templateSend = {
  sellerNewOrder(to: string, args: BuildTemplateArgs<SellerOrderBase & WithOrderNumber>): TemplateMessageInput {
    const orderId = args.orderId ?? "";
    const summary = args.orderItems ?? "See order details";
    const buyer = args.customerPhone ?? "N/A";
    const location = args.customerLocation ?? "N/A";
    return {
      to,
      templateName: "seller_new_order",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            { text: args.sellerName ?? "Vendly" },
            { text: orderId },
            { text: summary },
            { text: args.buyerName ?? "Buyer" },
            { text: buyer },
            { text: location },
            { text: String(args.total ?? "") },
          ],
        },
      ],
    };
  },

  buyerOrderReceived(to: string, args: BuildTemplateArgs<BuyerOrderBase & WithLink>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_order_received",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            { text: args.buyerName ?? "Customer" },
            { text: args.storeName ?? "the store" },
            { text: args.sellerWhatsappLink ?? "" },
          ],
        },
      ],
    };
  },

  buyerOrderReady(to: string, args: BuildTemplateArgs<BuyerOrderBase>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_order_ready",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            { text: args.buyerName ?? "Customer" },
            { text: args.storeName ?? "the store" },
          ],
        },
      ],
    };
  },

  buyerOutForDelivery(to: string, args: BuildTemplateArgs<BuyerOrderBase & OutForDelivery>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_out_for_delivery",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            { text: args.buyerName ?? "Customer" },
            { text: args.storeName ?? "the store" },
            { text: args.riderDetails ?? "Vendly Rider" },
          ],
        },
      ],
    };
  },

  buyerOrderDelivered(to: string, args: BuildTemplateArgs<BuyerOrderBase>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_order_delivered",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            { text: args.buyerName ?? "Customer" },
            { text: args.storeName ?? "the store" },
          ],
        },
      ],
    };
  },

  buyerOrderDeclined(to: string, args: BuildTemplateArgs<BuyerOrderBase & WithLink>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_order_declined",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            { text: args.buyerName ?? "Customer" },
            { text: args.storeName ?? "the store" },
            { text: args.sellerWhatsappLink ?? "" },
          ],
        },
      ],
    };
  },
};

// Fallback helper (unused today) to quickly build a body-only template input
export function makeBodyTemplate(to: string, templateName: string, text: string): TemplateMessageInput {
  const base = bodyText(text);
  return { ...base, to, templateName };
}
