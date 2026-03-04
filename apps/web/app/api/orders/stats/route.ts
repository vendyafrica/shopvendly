import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { orderService } from "@/features/orders/lib/order-service";
import { db } from "@shopvendly/db/db";
import { tenantMemberships } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";
import { resolveTenantAdminAccessByStoreId } from "@/app/admin/lib/admin-access";

/**
 * GET /api/orders/stats
 * Get order statistics for the authenticated seller
 */
export async function GET(request: Request) {
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
            const membership = await db.query.tenantMemberships.findFirst({
                where: eq(tenantMemberships.userId, session.user.id),
            });

            if (!membership) {
                return NextResponse.json({ error: "No tenant found" }, { status: 404 });
            }
            tenantId = membership.tenantId;
        }

        const stats = await orderService.getOrderStats(tenantId);
        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching order stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
