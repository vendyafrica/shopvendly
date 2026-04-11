import { NextRequest } from "next/server";
import { orderService } from "@/modules/orders";
import { orderQuerySchema } from "@/modules/orders/lib/order-models";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { storeRepo } from "@/repo/store-repo";
import { jsonSuccess, jsonError, isDemoStore, getOptionalSession } from "@/lib/api/response-utils";

/**
 * GET /api/orders
 * List orders for the authenticated seller's tenant (or demo store)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getOptionalSession(request);
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId") || undefined;

        if (!storeId) return jsonError("Missing storeId", 400);

        const store = await storeRepo.findById(storeId);
        if (!store) return jsonError("Store not found", 404);

        if (!session?.user && !isDemoStore(store.slug)) return jsonError("Unauthorized", 401);

        let tenantId: string;
        if (session?.user) {
            const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
            if (!access.store) return jsonError("Store not found", 404);
            if (!access.isAuthorized) return jsonError("Forbidden", 403);
            tenantId = access.store.tenantId;
        } else {
            tenantId = store.tenantId;
        }

        const filters = orderQuerySchema.parse({
            status: searchParams.get("status") || undefined,
            paymentStatus: searchParams.get("paymentStatus") || undefined,
            page: searchParams.get("page") || 1,
            limit: searchParams.get("limit") || 20,
            search: searchParams.get("search") || undefined,
        });

        const result = await orderService.listOrders(tenantId, filters);
        return jsonSuccess(result);
    } catch (error) {
        console.error("Error listing orders:", error);
        return jsonError("Failed to list orders", 500);
    }
}
