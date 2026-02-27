import { Router } from "express";
import { createOrderSchema, orderService } from "../services/order-service";
import { capturePosthogEvent } from "../shared/utils/posthog";

export const storefrontOrdersRouter: Router = Router();

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

    return res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

// POST /api/storefront/orders/:orderId/pay
// Dummy/test payment confirmation — marks the order as paid without a real gateway.
// Used by the /pay/[orderId] payment page for sandbox testing.
storefrontOrdersRouter.post("/storefront/orders/:orderId/pay", async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const existing = await orderService.getOrderById(orderId);
    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (existing.paymentStatus === "paid") {
      // Idempotent — already paid
      return res.status(200).json({ success: true, alreadyPaid: true });
    }

    await orderService.updateOrderStatusByOrderId(orderId, {
      paymentStatus: "paid",
      status: "processing",
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

