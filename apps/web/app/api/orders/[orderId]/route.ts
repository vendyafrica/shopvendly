import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/features/orders/lib/order-service";
import { updateOrderStatusSchema } from "@/features/orders/lib/order-models";
import { db } from "@shopvendly/db/db";
import { tenantMemberships } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";

type RouteParams = {
    params: Promise<{ orderId: string }>;
};

/**
 * GET /api/orders/[orderId]
 * Get a single order by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

        const { orderId } = await params;
        const order = await orderService.getOrder(orderId, membership.tenantId);

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}

/**
 * PATCH /api/orders/[orderId]
 * Update order status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

        const { orderId } = await params;
        const body = await request.json();
        const input = updateOrderStatusSchema.parse(body);

        const updated = await orderService.updateOrderStatus(orderId, membership.tenantId, input);
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}
