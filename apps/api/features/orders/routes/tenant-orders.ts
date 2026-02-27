import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { requireAuth, requireTenantRole } from "../shared/middleware/auth";
import { orderService, updateOrderStatusSchema } from "../services/order-service";

export const tenantOrdersRouter: ExpressRouter = Router();

function getSingleParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

// GET /api/tenants/:tenantId/orders
tenantOrdersRouter.get(
  "/tenants/:tenantId/orders",
  requireAuth,
  requireTenantRole(["owner", "admin", "support", "staff"]),
  async (req, res, next) => {
    try {
      const tenantId = getSingleParam(req.params.tenantId);
      const list = await orderService.listOrdersForTenant(tenantId);
      return res.json({ orders: list });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/tenants/:tenantId/orders/:orderId
tenantOrdersRouter.patch(
  "/tenants/:tenantId/orders/:orderId",
  requireAuth,
  requireTenantRole(["owner", "admin", "support", "staff"]),
  async (req, res, next) => {
    try {
      const tenantId = getSingleParam(req.params.tenantId);
      const orderId = getSingleParam(req.params.orderId);
      const input = updateOrderStatusSchema.parse(req.body);
      const updated = await orderService.updateOrderStatus(orderId, tenantId, input);
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);
