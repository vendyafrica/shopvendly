import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/modules/orders";
import { orderQuerySchema } from "@/features/orders/lib/order-models";
import { ordersRepo } from "@/repo/orders-repo";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";

/**
 * GET /api/orders
 * List orders for the authenticated seller's tenant
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId") || undefined;

        let tenantId: string;
        if (storeId) {
            const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
            if (!access.store) {
                return NextResponse.json({ error: "Store not found" }, { status: 404 });
            }
            if (!access.isAuthorized) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            tenantId = access.store.tenantId;
        } else {
            const tenantIdResult = await ordersRepo.findTenantIdByUserId(session.user.id);

            if (!tenantIdResult) {
                return NextResponse.json({ error: "No tenant found" }, { status: 404 });
            }
            tenantId = tenantIdResult;
        }

        const filters = orderQuerySchema.parse({
            status: searchParams.get("status") || undefined,
            paymentStatus: searchParams.get("paymentStatus") || undefined,
            page: searchParams.get("page") || 1,
            limit: searchParams.get("limit") || 20,
            search: searchParams.get("search") || undefined,
        });

        const result = await orderService.listOrders(tenantId, filters);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error listing orders:", error);
        return NextResponse.json({ error: "Failed to list orders" }, { status: 500 });
    }
}
