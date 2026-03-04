import { Router } from "express";
import type { Router as ExpressRouter } from "express";

export const storefrontPaymentsRouter: ExpressRouter = Router();

// POST /api/storefront/orders/:orderId/pay
storefrontPaymentsRouter.post("/storefront/orders/:orderId/pay", async (req, res, next) => {
  try {
    return res.status(410).json({
      error: "Payment routes are disabled. Orders currently run on manual delivery and cash collection.",
    });
  } catch (err) {
    next(err);
  }
});
