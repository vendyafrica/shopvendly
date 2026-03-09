import { orderService } from "../../orders/services/order-service.js";
import {
  notifyCustomerPreparing,
  notifySellerCustomerDetails,
  notifySellerOrderDetails,
} from "../../messaging/services/notifications.js";
import { dispatchDeliveryProviderForOrder } from "./delivery-dispatch.js";

type PaymentMethodValue = "mobile_money" | "cash_on_delivery";

type HandlePaidOrderTransitionParams = {
  orderId: string;
  paymentMethod?: PaymentMethodValue;
  includeSellerContext?: boolean;
};

export async function handlePaidOrderTransition(params: HandlePaidOrderTransitionParams) {
  const { orderId, paymentMethod, includeSellerContext = false } = params;

  const existing = await orderService.getOrderById(orderId);
  if (!existing) {
    return null;
  }

  const update: {
    paymentStatus?: "paid";
    status?: "paid_processing";
    paymentMethod?: PaymentMethodValue;
  } = {};

  if (existing.paymentStatus !== "paid") {
    update.paymentStatus = "paid";
  }

  // Keep retry-safe transitions: paid flow converges into paid_processing.
  if (existing.status === "pending" || existing.status === "pending_seller_acceptance" || existing.status === "awaiting_payment") {
    update.status = "paid_processing";
  }

  if (paymentMethod && existing.paymentMethod !== paymentMethod) {
    update.paymentMethod = paymentMethod;
  }

  if (Object.keys(update).length > 0) {
    await orderService.updateOrderStatusByOrderId(orderId, update);
  }

  const full = await orderService.getOrderById(orderId);
  if (!full) {
    return null;
  }

  const jobs: Array<Promise<unknown>> = [
    notifyCustomerPreparing({ order: full }),
    dispatchDeliveryProviderForOrder(full.id),
  ];

  if (includeSellerContext) {
    const sellerPhone = await orderService.getTenantPhoneByTenantId(full.tenantId);
    jobs.push(
      notifySellerCustomerDetails({ sellerPhone, order: full }),
      notifySellerOrderDetails({ sellerPhone, order: full })
    );
  }

  await Promise.allSettled(jobs);

  return full;
}
