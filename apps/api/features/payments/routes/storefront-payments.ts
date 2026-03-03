import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { orderService } from "../../orders/services/order-service.js";
import { handlePaidOrderTransition } from "../services/payment-order-transition.js";
import { z } from "zod";

const orderIdSchema = z.string().uuid();

export const storefrontPaymentsRouter: ExpressRouter = Router();

// POST /api/storefront/orders/:orderId/pay
storefrontPaymentsRouter.post("/storefront/orders/:orderId/pay", async (req, res, next) => {
  try {
    const parse = orderIdSchema.safeParse(req.params.orderId);
    if (!parse.success) {
      return res.status(400).json({ error: "Invalid orderId" });
    }

    const orderId = parse.data;
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    await handlePaidOrderTransition({ orderId });

    return res.status(200).json({ orderId, paymentStatus: "paid" });
  } catch (err) {
    next(err);
  }
});
