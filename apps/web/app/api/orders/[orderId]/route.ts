import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/modules/orders";
import { updateOrderStatusSchema } from "@/modules/orders/lib/order-models";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { ordersRepo } from "@/repo/orders-repo";

import { type OrderRouteParams as RouteParams } from "@/models";

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

        const tenantId = await ordersRepo.findTenantIdByUserId(session.user.id);

        if (!tenantId) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const { orderId } = await params;
        const order = await orderService.getOrder(orderId, tenantId);

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

        const { orderId } = await params;
        const tenantId = await ordersRepo.findTenantIdByUserId(session.user.id);

        if (!tenantId) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const order = await orderService.getOrder(orderId, tenantId);

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const access = await resolveTenantAdminAccessByStoreId(session.user.id, order.storeId, "write");

        if (!access.isAuthorized || !access.store) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const input = updateOrderStatusSchema.parse(body);

        const updated = await orderService.updateOrderStatus(orderId, tenantId, input);
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}
