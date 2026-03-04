import type { TemplateMessageInput } from "./message-queue.js";

export const TEMPLATE_NAMES = [
  "seller_prepare_order_v1",
  "buyer_order_confirmed_v1",
  "buyer_out_for_delivery_v5",
  "buyer_order_delivered_v5",
  "delivery_provider_dispatch_v1",
] as const;

type BuyerOrderBase = {
  buyerName?: string | null;
  storeName?: string | null;
  orderId?: string | null;
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

type OutForDelivery = {
  orderId?: string | null;
  riderDetails?: string | null;
};

type DeliveryProviderDispatch = {
  orderId?: string | null;
  orderItems?: string | null;
  total?: string | number | null;
  sellerPhone?: string | null;
  buyerName?: string | null;
  buyerPhone?: string | null;
  deliveryAddress?: string | null;
};

type BuyerOrderConfirmed = BuyerOrderBase & {
  total?: string | number | null;
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
  sellerPrepareOrder(to: string, args: BuildTemplateArgs<SellerOrderBase & WithOrderNumber>): TemplateMessageInput {
    return {
      to,
      templateName: "seller_prepare_order_v1",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            namedTextParam("order_id", args.orderId ?? ""),
            namedTextParam("order_items", args.orderItems ?? "See order details"),
            namedTextParam("buyer_name", args.buyerName ?? "Buyer"),
            namedTextParam("buyer_phone", args.customerPhone ?? "N/A"),
            namedTextParam("buyer_address", args.customerLocation ?? "N/A"),
            namedTextParam("total", args.total ?? ""),
          ],
        },
      ],
    };
  },

  buyerOrderConfirmed(to: string, args: BuildTemplateArgs<BuyerOrderConfirmed>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_order_confirmed_v1",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            namedTextParam("order_id", args.orderId ?? ""),
            namedTextParam("store_name", args.storeName ?? "the store"),
            namedTextParam("total", args.total ?? ""),
          ],
        },
      ],
    };
  },

  buyerOutForDelivery(to: string, args: BuildTemplateArgs<BuyerOrderBase & OutForDelivery>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_out_for_delivery_v5",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            namedTextParam("order_id", args.orderId ?? ""),
            namedTextParam("rider_details", args.riderDetails ?? "Vendly Rider"),
          ],
        },
      ],
    };
  },

  buyerOrderDelivered(to: string, args: BuildTemplateArgs<BuyerOrderBase>): TemplateMessageInput {
    return {
      to,
      templateName: "buyer_order_delivered_v5",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            namedTextParam("order_id", args.orderId ?? ""),
            namedTextParam("store_name", args.storeName ?? "the store"),
          ],
        },
      ],
    };
  },

  deliveryProviderDispatch(to: string, args: BuildTemplateArgs<DeliveryProviderDispatch>): TemplateMessageInput {
    return {
      to,
      templateName: "delivery_provider_dispatch_v1",
      languageCode: "en_US",
      components: [
        {
          type: "body",
          parameters: [
            namedTextParam("order_id", args.orderId ?? ""),
            namedTextParam("order_items", args.orderItems ?? "See order details"),
            namedTextParam("total", args.total ?? ""),
            namedTextParam("seller_phone", args.sellerPhone ?? "N/A"),
            namedTextParam("buyer_name", args.buyerName ?? "Buyer"),
            namedTextParam("buyer_phone", args.buyerPhone ?? "N/A"),
            namedTextParam("buyer_address", args.deliveryAddress ?? "N/A"),
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
