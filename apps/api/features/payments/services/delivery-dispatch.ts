import { and, db, eq, isNull, orders } from "@shopvendly/db";
import { notifyDeliveryPartnerNewOrder } from "../../messaging/services/notifications.js";
import { orderService } from "../../orders/services/order-service.js";

export type DeliveryDispatchPayload = {
  provider: "whatsapp_text";
  order: {
    id: string;
    orderNumber: string | null;
    totalAmount: number;
    currency: string;
  };
  seller: {
    phone: string | null;
  };
  buyer: {
    name: string;
    phone: string | null;
    deliveryAddress: string | null;
  };
  items: Array<{
    productName: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};

export type DeliveryDispatchResult = {
  dispatched: boolean;
  reason?: "order_not_found" | "already_dispatched" | "provider_unavailable";
  dispatchId?: string;
};

function buildDeliveryDispatchPayload(params: {
  provider: "whatsapp_text";
  sellerPhone: string | null;
  order: NonNullable<Awaited<ReturnType<typeof orderService.getOrderById>>>;
}): DeliveryDispatchPayload {
  const { provider, sellerPhone, order } = params;

  return {
    provider,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      currency: order.currency,
    },
    seller: {
      phone: sellerPhone,
    },
    buyer: {
      name: order.customerName,
      phone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
    },
    items: (order.items || []).map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
  };
}

export async function dispatchDeliveryProviderForOrder(orderId: string): Promise<DeliveryDispatchResult> {
  const order = await orderService.getOrderById(orderId);
  if (!order) {
    return { dispatched: false, reason: "order_not_found" };
  }

  if (order.deliveryProviderDispatchId) {
    return {
      dispatched: false,
      reason: "already_dispatched",
      dispatchId: order.deliveryProviderDispatchId,
    };
  }

  const provider = "whatsapp_text" as const;
  const dispatchId = `wa:${order.id}`;
  const sellerPhone = await orderService.getTenantPhoneByTenantId(order.tenantId);
  const payload = buildDeliveryDispatchPayload({ provider, sellerPhone, order });

  const [claimed] = await db
    .update(orders)
    .set({
      deliveryProvider: provider,
      deliveryProviderDispatchId: dispatchId,
      deliveryStatus: "dispatching",
      deliveryAssignedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, order.id), isNull(orders.deletedAt), isNull(orders.deliveryProviderDispatchId)))
    .returning({ id: orders.id });

  if (!claimed) {
    return {
      dispatched: false,
      reason: "already_dispatched",
      dispatchId,
    };
  }

  try {
    console.info("[DeliveryDispatch] Dispatching provider payload", {
      orderId: order.id,
      dispatchId,
      provider,
      payload,
    });

    const queued = await notifyDeliveryPartnerNewOrder({ order });

    if (!queued) {
      await db
        .update(orders)
        .set({
          deliveryStatus: "provider_unavailable",
          deliveryProviderDispatchId: null,
          deliveryAssignedAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(orders.id, order.id), isNull(orders.deletedAt)));

      return { dispatched: false, reason: "provider_unavailable" };
    }

    await db
      .update(orders)
      .set({
        deliveryStatus: "assigned",
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, order.id), isNull(orders.deletedAt)));

    return { dispatched: true, dispatchId };
  } catch (error) {
    await db
      .update(orders)
      .set({
        deliveryStatus: "exception",
        deliveryProviderDispatchId: null,
        deliveryAssignedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, order.id), isNull(orders.deletedAt)));

    throw error;
  }
}
