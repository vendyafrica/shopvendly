import { NextRequest } from "next/server";
import { orderService } from "@/modules/orders";
import { ordersRepo } from "@/repo/orders-repo";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/lib/api/response-utils";

/**
 * GET /api/orders/stats
 * Get order statistics for the authenticated seller
 */
export const GET = withApi({}, async ({ req, session }) => {
    const storeId = new URL(req.url).searchParams.get("storeId") || undefined;

    let tenantId: string;
    if (storeId) {
        const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
        if (!access.store) throw new HttpError("Store not found", 404);
        if (!access.isAuthorized) throw new HttpError("Forbidden", 403);
        tenantId = access.store.tenantId;
    } else {
        const tenantIdResult = await ordersRepo.findTenantIdByUserId(session.user.id);
        if (!tenantIdResult) throw new HttpError("No tenant found", 404);
        tenantId = tenantIdResult;
    }

    const stats = await orderService.getOrderStats(tenantId);
    return jsonSuccess(stats);
});
