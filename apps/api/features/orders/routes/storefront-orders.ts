import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { z } from "zod";
import { createOrderSchema, orderService } from "../services/order-service.js";
import { capturePosthogEvent } from "../../../shared/utils/posthog.js";
import {
  notifyCustomerOrderReceived,
  notifySellerNewOrder,
} from "../../messaging/services/notifications.js";
import { dispatchDeliveryProviderForOrder } from "../../payments/services/delivery-dispatch.js";
import { buildCollectoPricingBreakdown } from "../../payments/services/collecto-pricing.js";

export const storefrontOrdersRouter: ExpressRouter = Router();

const checkoutSchema = createOrderSchema.extend({
  amount: z.number().positive().optional(),
});

function getCollectoMode(): "disabled" | "live" {
  const value = (process.env.COLLECTO_PAYMENT_MODE || "disabled").trim().toLowerCase();
  return value === "live" ? "live" : "disabled";
}

function isCollectoConfiguredForLive() {
  return Boolean(process.env.COLLECTO_USERNAME && process.env.COLLECTO_API_KEY);
}

function captureOrderCreated(order: Awaited<ReturnType<typeof orderService.createOrder>>, slug: string) {
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
}

async function notifyOrderCreated(order: Awaited<ReturnType<typeof orderService.createOrder>>) {
  const sellerPhone = await orderService.getTenantPhoneByTenantId(order.tenantId);
  await Promise.allSettled([
    notifySellerNewOrder({ sellerPhone, order }),
    notifyCustomerOrderReceived({ order }),
    dispatchDeliveryProviderForOrder(order.id),
  ]);
}

storefrontOrdersRouter.post("/storefront/:slug/checkout", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const input = checkoutSchema.parse(req.body);

    if (input.paymentMethod === "mobile_money") {
      if (getCollectoMode() === "disabled" || !isCollectoConfiguredForLive()) {
        return res.status(503).json({
          error: {
            code: "COLLECTO_DISABLED",
            message: "Mobile money is not enabled for this storefront.",
          },
        });
      }
    }

    const order = await orderService.createOrder(slug, input);
    const storePaymentSettings = await orderService.getStorePaymentSettingsBySlug(slug);
    const paymentPricing = input.paymentMethod === "mobile_money"
      ? buildCollectoPricingBreakdown({
          subtotalAmount: order.subtotal,
          settings: storePaymentSettings,
        })
      : {
          subtotalAmount: order.subtotal,
          customerFeeAmount: 0,
          customerPaidAmount: order.totalAmount,
          merchantReceivableAmount: order.totalAmount,
          passTransactionFeeToCustomer: false,
          payoutMode: storePaymentSettings.collectoPayoutMode,
        };

    captureOrderCreated(order, slug);

    if (input.paymentMethod !== "mobile_money") {
      await notifyOrderCreated(order);
      return res.status(201).json({ ok: true, order, paymentPricing });
    }

    await orderService.updateOrderStatusByOrderId(order.id, {
      status: "awaiting_payment",
      paymentMethod: "mobile_money",
      paymentStatus: "pending",
    });

    return res.status(201).json({
      ok: true,
      order: {
        ...order,
        status: "awaiting_payment",
        paymentMethod: "mobile_money",
        paymentStatus: "pending",
      },
      payment: {
        mode: "live",
        status: "ready_to_initiate",
      },
      paymentPricing,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/storefront/:slug/orders
storefrontOrdersRouter.post("/storefront/:slug/orders", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const input = createOrderSchema.parse(req.body);

    const order = await orderService.createOrder(slug, input);

    captureOrderCreated(order, slug);
    await notifyOrderCreated(order);

    return res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

