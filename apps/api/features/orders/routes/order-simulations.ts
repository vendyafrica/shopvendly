import { Router } from "express";
import { requireAuth, requireTenantRole } from "../shared/middleware/auth";
import { orderService } from "../services/order-service";
import { notifySellerNewOrder, notifyCustomerOrderReceived } from "../../messaging/services/notifications";

export const orderSimulationsRouter :Router = Router();

// POST /api/tenants/:tenantId/orders/:orderId/simulate-paid
orderSimulationsRouter.post(
  "/tenants/:tenantId/orders/:orderId/simulate-paid",
  requireAuth,
  requireTenantRole(["owner", "admin"]),
  async (req, res, next) => {
    try {
      const { tenantId, orderId } = req.params;

      const tenantIdStr = Array.isArray(tenantId) ? tenantId[0] : tenantId;
      const orderIdStr = Array.isArray(orderId) ? orderId[0] : orderId;

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
