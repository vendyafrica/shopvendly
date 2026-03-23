import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/modules/orders";
import { orderQuerySchema } from "@/modules/orders/lib/order-models";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { storeRepo } from "@/repo/store-repo";

/**
 * GET /api/orders
 * List orders for the authenticated seller's tenant
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId") || undefined;

        if (!storeId) {
            return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
        }

        const store = await storeRepo.findById(storeId);

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const isDemoStore = store.slug === "vendly";

        if (!session?.user && !isDemoStore) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let tenantId: string;
        if (session?.user) {
            const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
            if (!access.store) {
                return NextResponse.json({ error: "Store not found" }, { status: 404 });
            }
            if (!access.isAuthorized) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
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
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error listing orders:", error);
        return NextResponse.json({ error: "Failed to list orders" }, { status: 500 });
    }
}

