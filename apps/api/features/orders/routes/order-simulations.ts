import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { z } from "zod";
import { requireAuth, requireTenantRole } from "../../../shared/middleware/auth.js";
import { orderService } from "../services/order-service.js";
import { handlePaidOrderTransition } from "../../payments/services/payment-order-transition.js";

export const orderSimulationsRouter: ExpressRouter = Router();

const simulateParamsSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
});

// POST /api/tenants/:tenantId/orders/:orderId/simulate-paid
orderSimulationsRouter.post(
  "/tenants/:tenantId/orders/:orderId/simulate-paid",
  requireAuth,
  requireTenantRole(["owner", "admin"]),
  async (req, res, next) => {
    try {
      const params = simulateParamsSchema.safeParse(req.params);
      if (!params.success) {
        return res.status(400).json({
          error: "Invalid path parameters — tenantId and orderId must be valid UUIDs",
          code: "VALIDATION_ERROR",
        });
      }

      const { tenantId, orderId } = params.data;

      const existingOrder = await orderService.getOrderById(orderId);
      if (!existingOrder) {
        return res.status(404).json({ error: "Order not found", code: "NOT_FOUND" });
      }

      if (existingOrder.tenantId !== tenantId) {
        return res.status(403).json({
          error: "Order does not belong to this tenant",
          code: "FORBIDDEN",
        });
      }

      const updated = await handlePaidOrderTransition({
        orderId,
        includeSellerContext: true,
      });

      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

