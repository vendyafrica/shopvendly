import { orders, type OrderItem } from "@shopvendly/db";
import { enqueueTemplateMessage, enqueueTextMessage } from "./whatsapp/message-queue.js";
import { templateSend } from "./whatsapp/template-registry.js";
import { normalizePhoneToE164 } from "../../../shared/utils/phone.js";
import { buyerPreferenceStore } from "./whatsapp/preference-store.js";
import { orderService } from "../../orders/services/order-service.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeToWhatsApp(phone: string | null | undefined, label: string, context: Record<string, unknown>): string | null {
  if (!phone) {
    console.warn(`[Notify] Missing ${label} phone; skipping`, context);
    return null;
  }

  const to = normalizePhoneToE164(phone, {
    defaultCountryCallingCode: process.env.DEFAULT_COUNTRY_CALLING_CODE || "256",
  });

  if (!to) {
    console.warn(`[Notify] Invalid ${label} phone; cannot normalize to E.164`, { phone, ...context });
    return null;
  }

  return to.replace(/^\+/, "");
}

function getWebBaseUrl() {
  const configured = process.env.WEB_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://shopvendly.store";
}

export async function notifySellerCswOpener(params: { sellerPhone: string | null; tenantId: string }) {
  const { sellerPhone, tenantId } = params;
  const to = normalizeToWhatsApp(sellerPhone, "seller", { tenantId });
  if (!to) return;

  const dayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `seller:csw_opener:${tenantId}:${dayKey}:${to}`;
  await sendOnce(key, () =>
    enqueueTextMessage({
      to,
      body: "Hi! Reply ACCEPT or DECLINE to manage new orders. You can also reply READY, OUT, or DELIVERED to update order status.",
      tenantId,
      dedupeKey: key,
    })
  );
}

export async function notifyDeliveryPartnerNewOrder(params: { order: OrderLike }): Promise<boolean> {
  const { order } = params;
  const to = normalizeToWhatsApp(order.store?.deliveryProviderPhone, "delivery provider", {
    orderId: order.id,
    storeId: order.storeId,
  });
  if (!to) return false;

  const sellerPhone = await orderService.getTenantPhoneByTenantId(order.tenantId);

  const key = `delivery_partner:new_order:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTextMessage({
      to,
      body: [
        `🚚 New delivery request ${order.orderNumber || order.id}`,
        `Items: ${formatItemsSummary(order.items)}`,
        `Total: ${order.currency || "UGX"} ${String(order.totalAmount)}`,
        `Seller contact (pickup): ${sellerPhone || "N/A"}`,
        `Buyer: ${order.customerName}`,
        `Buyer phone: ${order.customerPhone || "N/A"}`,
        `Delivery address: ${order.deliveryAddress || "N/A"}`,
        "Manual flow: call seller for pickup directions, deliver to buyer, collect cash, then remit to seller.",
      ].join("\n"),
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );

  return true;
}

type OrderLike = (typeof orders.$inferSelect) & {
  items?: Array<OrderItem> | null;
  store?: {
    name?: string | null;
    deliveryProviderPhone?: string | null;
  } | null;
};

function formatItemsSummary(items: Array<OrderItem> | null | undefined): string {
  if (!items || items.length === 0) return "See order details";
  return items
    .map((i) => `${i.quantity ?? 1}x ${i.productName || "Item"}`)
    .join(", ");
}

function formatCustomerDetails(order: OrderLike): string {
  const parts: string[] = [];
  parts.push(order.customerName);
  if (order.customerPhone) parts.push(order.customerPhone);
  if (order.deliveryAddress) parts.push(`Address: ${order.deliveryAddress}`);
  if (order.notes) parts.push(`Note: ${order.notes}`);
  return parts.join(". ");
}

function buildPaymentLink(order: OrderLike) {
  const query = new URLSearchParams({
    amount: String(order.totalAmount ?? ""),
    currency: order.currency ?? "UGX",
    orderNumber: order.orderNumber ?? "",
  });

  const payLink = `${getWebBaseUrl()}/pay/${order.id}?${query.toString()}`;
  const payLinkToken = `${order.id}?${query.toString()}`;

  return { payLink, payLinkToken };
}

async function sendOnce(key: string, fn: () => Promise<unknown>) {
  const result = await fn();
  if (!result) {
    console.log("[Notify] Skipping duplicate", { key });
  }
}

// ---------------------------------------------------------------------------
// Seller notifications
// ---------------------------------------------------------------------------

export async function notifySellerNewOrder(params: {
  sellerPhone: string | null;
  order: OrderLike;
}) {
  const { sellerPhone, order } = params;
  const to = normalizeToWhatsApp(sellerPhone, "seller", { orderId: order.id, tenantId: order.tenantId });
  if (!to) return;

  const key = `seller:new_order:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTextMessage({
      to,
      body: [
        `🛍️ New order ${order.orderNumber || order.id}`,
        `Items: ${formatItemsSummary(order.items)}`,
        `Buyer: ${order.customerName}`,
        `Buyer phone: ${order.customerPhone || "N/A"}`,
        `Delivery address: ${order.deliveryAddress || "N/A"}`,
        `Total: ${order.currency || "UGX"} ${String(order.totalAmount)}`,
      ].join("\n"),
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifyCustomerPreparing(params: { order: OrderLike }) {
  const { order } = params;
  const to = normalizeToWhatsApp(order.customerPhone, "customer", { orderId: order.id, orderNumber: order.orderNumber });
  if (!to) return;

  const key = `customer:preparing:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTextMessage({
      to,
      body: `✅ Payment received for order ${order.orderNumber}. We are preparing your order now.`,
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifySellerOrderDetails(params: {
  sellerPhone: string | null;
  order: OrderLike;
}) {
  const { sellerPhone, order } = params;
  const to = normalizeToWhatsApp(sellerPhone, "seller", { orderId: order.id });
  if (!to) return;

  const key = `seller:order_details:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTextMessage({
      to,
      body: `Order ${order.orderNumber} details: ${formatItemsSummary(order.items)}`,
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifySellerCustomerDetails(params: {
  sellerPhone: string | null;
  order: OrderLike;
}) {
  const { sellerPhone, order } = params;
  const to = normalizeToWhatsApp(sellerPhone, "seller", { orderId: order.id });
  if (!to) return;

  const key = `seller:customer_details:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTextMessage({
      to,
      body: `Customer details for ${order.orderNumber}: ${formatCustomerDetails(order)}`,
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifySellerMarkReady(params: {
  sellerPhone: string | null;
  order: OrderLike;
}) {
  const { sellerPhone, order } = params;
  const to = normalizeToWhatsApp(sellerPhone, "seller", { orderId: order.id });
  if (!to) return;

  const key = `seller:mark_ready:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTextMessage({
      to,
      body: `Marked ${order.orderNumber} as READY.`,
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifySellerOutForDelivery(params: {
  sellerPhone: string | null;
  order: OrderLike;
  riderDetails?: string;
}) {
  const { sellerPhone, order } = params;
  const to = normalizeToWhatsApp(sellerPhone, "seller", { orderId: order.id });
  if (!to) return;

  const key = `seller:out_for_delivery:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTextMessage({
      to,
      body: `Order ${order.orderNumber} is OUT FOR DELIVERY. Rider: ${params.riderDetails || "Vendly Rider (+256700000000)"}`,
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifySellerOrderCompleted(params: {
  sellerPhone: string | null;
  order: OrderLike;
}) {
  const { sellerPhone, order } = params;
  const to = normalizeToWhatsApp(sellerPhone, "seller", { orderId: order.id });
  if (!to) return;

  const key = `seller:order_completed:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTextMessage({
      to,
      body: `Order ${order.orderNumber} marked as DELIVERED/COMPLETED.`,
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

// ---------------------------------------------------------------------------
// Buyer / Customer notifications
// ---------------------------------------------------------------------------

export async function notifyCustomerOrderReceived(params: { order: OrderLike }) {
  const { order } = params;
  const to = normalizeToWhatsApp(order.customerPhone, "customer", { orderId: order.id, orderNumber: order.orderNumber });
  if (!to) return;

  const key = `customer:received:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTextMessage({
      to,
      body: `✅ We have received your order ${order.orderNumber || ""}. ${order.store?.name || "The seller"} is now working on it and will prepare delivery updates shortly.`,
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifyCustomerOrderAccepted(params: { order: OrderLike }) {
  const { order } = params;
  const to = normalizeToWhatsApp(order.customerPhone, "customer", { orderId: order.id, orderNumber: order.orderNumber });
  if (!to) return;

  const { payLink, payLinkToken } = buildPaymentLink(order);

  const key = `customer:accepted:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTemplateMessage({
      input: templateSend.buyerPaymentLink(to, {
        buyerName: order.customerName,
        storeName: order.store?.name || "the store",
        orderId: order.orderNumber,
        total: String(order.totalAmount),
        payLink,
        payLinkToken,
      }),
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifyCustomerPendingPaymentLink(params: { order: OrderLike }) {
  const { order } = params;
  const to = normalizeToWhatsApp(order.customerPhone, "customer", {
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
  });
  if (!to) return;

  const { payLink, payLinkToken } = buildPaymentLink(order);

  const key = `customer:pending_payment_link:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTemplateMessage({
      input: templateSend.buyerPaymentLink(to, {
        buyerName: order.customerName,
        storeName: order.store?.name || "the store",
        orderId: order.orderNumber,
        total: String(order.totalAmount),
        payLink,
        payLinkToken,
      }),
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifyCustomerOrderReady(params: { order: OrderLike }) {
  const { order } = params;
  if (buyerPreferenceStore.isOnce(order.customerPhone)) return;
  const to = normalizeToWhatsApp(order.customerPhone, "customer", { orderId: order.id, orderNumber: order.orderNumber });
  if (!to) return;

  const key = `customer:ready:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTemplateMessage({
      input: templateSend.buyerOrderReady(to, {
        buyerName: order.customerName,
        storeName: order.store?.name || "the store",
      }),
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifyCustomerOutForDelivery(params: { order: OrderLike; riderDetails?: string }) {
  const { order } = params;
  const to = normalizeToWhatsApp(order.customerPhone, "customer", { orderId: order.id, orderNumber: order.orderNumber });
  if (!to) return;

  const key = `customer:out_for_delivery:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTemplateMessage({
      input: templateSend.buyerOutForDelivery(to, {
        buyerName: order.customerName,
        storeName: order.store?.name || "the store",
        riderDetails: params.riderDetails || "Vendly Rider (+256700000000)",
      }),
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifyCustomerOrderDelivered(params: { order: OrderLike }) {
  const { order } = params;
  const to = normalizeToWhatsApp(order.customerPhone, "customer", { orderId: order.id, orderNumber: order.orderNumber });
  if (!to) return;

  const key = `customer:delivered:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTemplateMessage({
      input: templateSend.buyerOrderDelivered(to, {
        buyerName: order.customerName,
        storeName: order.store?.name || "the store",
      }),
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}

export async function notifyCustomerOrderDeclined(params: { order: OrderLike }) {
  const { order } = params;
  if (buyerPreferenceStore.isOnce(order.customerPhone)) return;
  const to = normalizeToWhatsApp(order.customerPhone, "customer", { orderId: order.id, orderNumber: order.orderNumber });
  if (!to) return;

  const sellerPhone = await orderService.getTenantPhoneByTenantId(order.tenantId);
  const sellerDigits = normalizeToWhatsApp(sellerPhone, "seller", { tenantId: order.tenantId, orderId: order.id });
  const sellerWhatsappLink = sellerDigits ? `https://wa.me/${sellerDigits}` : "https://wa.me/256700000000";

  const key = `customer:declined:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTemplateMessage({
      input: templateSend.buyerOrderDeclined(to, {
        buyerName: order.customerName,
        storeName: order.store?.name || "the store",
        sellerWhatsappLink,
      }),
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}
