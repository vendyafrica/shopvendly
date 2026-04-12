import { z } from "zod";
import { orderService } from "@/modules/orders";
import { updateOrderStatusSchema } from "@/modules/orders/services/order-models";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { ordersRepo } from "@/modules/orders/repo/orders-repo";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/shared/lib/api/response-utils";

/**
 * GET /api/orders/[orderId]
 * Get a single order by ID
 */
export const GET = withApi<undefined, { orderId: string }>({}, async ({ session, params }) => {
    const tenantId = await ordersRepo.findTenantIdByUserId(session.user.id);
    if (!tenantId) throw new HttpError("No tenant found", 404);

    const order = await orderService.getOrder(params.orderId, tenantId);
    if (!order) throw new HttpError("Order not found", 404);

    return jsonSuccess(order);
});

/**
 * PATCH /api/orders/[orderId]
 * Update order status
 */
export const PATCH = withApi<z.infer<typeof updateOrderStatusSchema>, { orderId: string }>({ schema: updateOrderStatusSchema }, async ({ session, params, body }) => {
    const tenantId = await ordersRepo.findTenantIdByUserId(session.user.id);
    if (!tenantId) throw new HttpError("No tenant found", 404);

    const order = await orderService.getOrder(params.orderId, tenantId);
    if (!order) throw new HttpError("Order not found", 404);

    const access = await resolveTenantAdminAccessByStoreId(session.user.id, order.storeId, "write");
    if (!access.isAuthorized || !access.store) throw new HttpError("Forbidden", 403);

    const updated = await orderService.updateOrderStatus(params.orderId, tenantId, body);
    return jsonSuccess(updated);
});
