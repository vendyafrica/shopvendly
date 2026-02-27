import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/features/orders/lib/order-service";
import { db } from "@shopvendly/db/db";
import { tenants, tenantMemberships } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";

/**
 * GET /api/orders/stats
 * Get order statistics for the authenticated seller
 */
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const membership = await db.query.tenantMemberships.findFirst({
            where: eq(tenantMemberships.userId, session.user.id),
        });

        if (!membership) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const stats = await orderService.getOrderStats(membership.tenantId);
        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching order stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
