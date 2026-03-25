import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { z } from "zod";
import { requireAuth, requireTenantRole } from "../../../shared/middleware/auth.js";
import { orderService, updateOrderStatusSchema } from "../services/order-service.js";

export const tenantOrdersRouter: ExpressRouter = Router();

const tenantIdParamSchema = z.object({ tenantId: z.string().uuid() });
const orderParamsSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
});

// GET /api/tenants/:tenantId/orders
tenantOrdersRouter.get(
  "/tenants/:tenantId/orders",
  requireAuth,
  requireTenantRole(["owner", "admin", "support", "staff"]),
  async (req, res, next) => {
    try {
      const params = tenantIdParamSchema.safeParse(req.params);
      if (!params.success) {
        return res.status(400).json({
          error: "Invalid tenantId — must be a valid UUID",
          code: "VALIDATION_ERROR",
        });
      }

      const list = await orderService.listOrdersForTenant(params.data.tenantId);
      return res.json({ data: list });
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
      const params = orderParamsSchema.safeParse(req.params);
      if (!params.success) {
        return res.status(400).json({
          error: "Invalid path parameters — tenantId and orderId must be valid UUIDs",
          code: "VALIDATION_ERROR",
        });
      }

      const input = updateOrderStatusSchema.parse(req.body);
      const updated = await orderService.updateOrderStatus(
        params.data.orderId,
        params.data.tenantId,
        input,
      );
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

