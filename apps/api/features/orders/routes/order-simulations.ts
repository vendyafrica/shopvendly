import { Router } from "express";
import { requireAuth, requireTenantRole } from "../../../shared/middleware/auth.js";
import { orderService } from "../services/order-service.js";
import { notifySellerNewOrder, notifyCustomerOrderReceived } from "../../messaging/services/notifications.js";

export const orderSimulationsRouter :Router = Router();

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

      const updated = await orderService.updateOrderStatus(orderIdStr, tenantIdStr, {
        paymentStatus: "paid",
      });

      const fullOrder = await orderService.getOrderById(orderIdStr);
      if (fullOrder) {
        const sellerPhone = await orderService.getTenantPhoneByTenantId(tenantIdStr);
        await notifySellerNewOrder({ sellerPhone, order: fullOrder });
        await notifyCustomerOrderReceived({ order: fullOrder });
      }

      return res.json({ ok: true, order: updated });
    } catch (err) {
      next(err);
    }
  }
);
