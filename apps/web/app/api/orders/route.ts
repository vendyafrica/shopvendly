import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/features/orders/lib/order-service";
import { orderQuerySchema } from "@/features/orders/lib/order-models";
import { db } from "@shopvendly/db/db";
import { tenantMemberships } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";

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

        // Get user's tenant
        const membership = await db.query.tenantMemberships.findFirst({
            where: eq(tenantMemberships.userId, session.user.id),
        });

        if (!membership) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const filters = orderQuerySchema.parse({
            status: searchParams.get("status") || undefined,
            paymentStatus: searchParams.get("paymentStatus") || undefined,
            page: searchParams.get("page") || 1,
            limit: searchParams.get("limit") || 20,
            search: searchParams.get("search") || undefined,
        });

        const result = await orderService.listOrders(membership.tenantId, filters);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error listing orders:", error);
        return NextResponse.json({ error: "Failed to list orders" }, { status: 500 });
    }
}
