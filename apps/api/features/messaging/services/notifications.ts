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
    enqueueTemplateMessage({
      input: templateSend.deliveryProviderDispatch(to, {
        orderId: order.orderNumber || order.id,
        orderItems: formatItemsSummary(order.items),
        total: `${order.currency || "UGX"} ${String(order.totalAmount)}`,
        sellerPhone: sellerPhone || "N/A",
        buyerName: order.customerName,
        buyerPhone: order.customerPhone || "N/A",
        deliveryAddress: order.deliveryAddress || "N/A",
      }),
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
    enqueueTemplateMessage({
      input: templateSend.sellerPrepareOrder(to, {
        orderId: order.orderNumber || order.id,
        orderItems: formatItemsSummary(order.items),
        buyerName: order.customerName,
        customerPhone: order.customerPhone || "N/A",
        customerLocation: order.deliveryAddress || "N/A",
        total: `${order.currency || "UGX"} ${String(order.totalAmount)}`,
      }),
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

  const key = `customer:accepted:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTemplateMessage({
      input: templateSend.buyerOrderConfirmed(to, {
        orderId: order.orderNumber || order.id,
        storeName: order.store?.name || "the store",
        total: `${order.currency || "UGX"} ${String(order.totalAmount)}`,
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
    enqueueTextMessage({
      to,
      body: `📦 Update for ${order.orderNumber || order.id}: your order is packed and ready for dispatch.`,
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
        orderId: order.orderNumber || order.id,
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
        orderId: order.orderNumber || order.id,
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

  const key = `customer:declined:${order.id}:${to}`;
  await sendOnce(key, () =>
    enqueueTextMessage({
      to,
      body: `⚠️ Your order ${order.orderNumber || order.id} could not be fulfilled by ${order.store?.name || "the seller"}.`,
      tenantId: order.tenantId,
      orderId: order.id,
      dedupeKey: key,
    })
  );
}
