import { orderService } from "@/modules/orders";
import { orderQuerySchema } from "@/modules/orders/lib/order-models";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { storeRepo } from "@/repo/store-repo";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError, isDemoStore } from "@/lib/api/response-utils";

/**
 * GET /api/orders
 * List orders for the authenticated seller's tenant (or demo store)
 */
export const GET = withApi({ auth: false }, async ({ req, session }) => {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId") || undefined;

    if (!storeId) throw new HttpError("Missing storeId", 400);

    const store = await storeRepo.findById(storeId);
    if (!store) throw new HttpError("Store not found", 404);

    if (!session?.user && !isDemoStore(store.slug)) throw new HttpError("Unauthorized", 401);

    let tenantId: string;
    if (session?.user) {
        const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
        if (!access.store) throw new HttpError("Store not found", 404);
        if (!access.isAuthorized) throw new HttpError("Forbidden", 403);
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
});