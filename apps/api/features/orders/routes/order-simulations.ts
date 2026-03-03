import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireAuth, requireTenantRole } from "../../../shared/middleware/auth.js";
import { orderService } from "../services/order-service.js";
import { handlePaidOrderTransition } from "../../payments/services/payment-order-transition.js";

export const orderSimulationsRouter: ExpressRouter = Router();

// POST /api/tenants/:tenantId/orders/:orderId/simulate-paid
orderSimulationsRouter.post(
  "/tenants/:tenantId/orders/:orderId/simulate-paid",
  requireAuth,
  requireTenantRole(["owner", "admin"]),
  async (req, res, next) => {
    try {
      const { tenantId, orderId } = req.params;

      const tenantIdStr = Array.isArray(tenantId) ? tenantId[0] : tenantId ?? "";
      const orderIdStr = Array.isArray(orderId) ? orderId[0] : orderId ?? "";

      if (!tenantIdStr || !orderIdStr) {
        return res.status(400).json({ error: "tenantId and orderId are required" });
      }

      const existingOrder = await orderService.getOrderById(orderIdStr);
      if (!existingOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (existingOrder.tenantId !== tenantIdStr) {
        return res.status(403).json({ error: "Order does not belong to this tenant" });
      }

      const updated = await handlePaidOrderTransition({
        orderId: orderIdStr,
        includeSellerContext: true,
      });

      return res.json({ ok: true, order: updated });
    } catch (err) {
      next(err);
    }
  }
);
