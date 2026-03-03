import type { TemplateMessageInput } from "./message-queue.js";

export const TEMPLATE_NAMES = [
  "seller_new_order_action_v10",
  "buyer_order_received_v10",
  "buyer_order_ready_v10",
  "buyer_out_for_delivery_v10",
  "buyer_order_delivered_v10",
  "buyer_order_declined_v10",
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

type NamedTextParam = { type: "text"; text: string; parameter_name: string };

function namedTextParam(name: string, value: string | number | null | undefined): NamedTextParam {
  return {
    type: "text",
    parameter_name: name,
    text: String(value ?? ""),
  };
}

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
      templateName: "seller_new_order_action_v10",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            namedTextParam("seller_name", args.sellerName ?? "Vendly"),
            namedTextParam("order_id", orderId),
            namedTextParam("order_items", summary),
            namedTextParam("buyer_name", args.buyerName ?? "Buyer"),
            namedTextParam("customer_phone", buyer),
            namedTextParam("customer_location", location),
            namedTextParam("total", args.total ?? ""),
          ],
        },
      ],
    };
  },

  buyerOrderReceived(to: string, args: BuildTemplateArgs<BuyerOrderBase & WithLink>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_order_received_v10",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            namedTextParam("buyer_name", args.buyerName ?? "Customer"),
            namedTextParam("store_name", args.storeName ?? "the store"),
            namedTextParam("seller_whatsapp_link", args.sellerWhatsappLink ?? ""),
          ],
        },
      ],
    };
  },

  buyerOrderReady(to: string, args: BuildTemplateArgs<BuyerOrderBase>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_order_ready_v10",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            namedTextParam("buyer_name", args.buyerName ?? "Customer"),
            namedTextParam("store_name", args.storeName ?? "the store"),
          ],
        },
      ],
    };
  },

  buyerOutForDelivery(to: string, args: BuildTemplateArgs<BuyerOrderBase & OutForDelivery>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_out_for_delivery_v10",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            namedTextParam("buyer_name", args.buyerName ?? "Customer"),
            namedTextParam("store_name", args.storeName ?? "the store"),
            namedTextParam("rider_details", args.riderDetails ?? "Vendly Rider"),
          ],
        },
      ],
    };
  },

  buyerOrderDelivered(to: string, args: BuildTemplateArgs<BuyerOrderBase>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_order_delivered_v10",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            namedTextParam("buyer_name", args.buyerName ?? "Customer"),
            namedTextParam("store_name", args.storeName ?? "the store"),
          ],
        },
      ],
    };
  },

  buyerOrderDeclined(to: string, args: BuildTemplateArgs<BuyerOrderBase & WithLink>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_order_declined_v10",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            namedTextParam("buyer_name", args.buyerName ?? "Customer"),
            namedTextParam("store_name", args.storeName ?? "the store"),
            namedTextParam("seller_whatsapp_link", args.sellerWhatsappLink ?? ""),
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
