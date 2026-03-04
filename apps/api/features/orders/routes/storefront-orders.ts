import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { createOrderSchema, orderService } from "../services/order-service.js";
import { capturePosthogEvent } from "../../../shared/utils/posthog.js";
import {
  notifyCustomerOrderReceived,
  notifySellerNewOrder,
} from "../../messaging/services/notifications.js";
import { dispatchDeliveryProviderForOrder } from "../../payments/services/delivery-dispatch.js";

export const storefrontOrdersRouter: ExpressRouter = Router();

// POST /api/storefront/:slug/orders
storefrontOrdersRouter.post("/storefront/:slug/orders", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const input = createOrderSchema.parse(req.body);

    const order = await orderService.createOrder(slug, input);

    capturePosthogEvent({
      distinctId: order.customerEmail || order.id,
      event: "order_created",
      properties: {
        orderId: order.id,
        storeSlug: slug,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        currency: order.currency,
      },
    });

    const sellerPhone = await orderService.getTenantPhoneByTenantId(order.tenantId);
    await Promise.allSettled([
      notifySellerNewOrder({ sellerPhone, order }),
      notifyCustomerOrderReceived({ order }),
      dispatchDeliveryProviderForOrder(order.id),
    ]);

    return res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

