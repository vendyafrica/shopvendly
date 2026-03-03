import { db } from "@shopvendly/db/db";
import { stores, tenants, products, orders, storefrontSessions } from "@shopvendly/db/schema";
import { eq, and, count, sum } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    const { id } = await params;

    try {
        const [store] = await db
            .select({
                id: stores.id,
                name: stores.name,
                slug: stores.slug,
                status: stores.status,
                description: stores.description,
                deliveryProviderPhone: stores.deliveryProviderPhone,
              
                createdAt: stores.createdAt,
                tenantName: tenants.fullName,
                tenantId: tenants.id,
            })
            .from(stores)
            .leftJoin(tenants, eq(stores.tenantId, tenants.id))
            .where(eq(stores.id, id));

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Aggregates
        const [productCount] = await db
            .select({ count: count() })
            .from(products)
            .where(eq(products.storeId, id));

        const [visitCount] = await db
            .select({ count: count() })
            .from(storefrontSessions)
            .where(eq(storefrontSessions.storeId, id));

        const [sales] = await db
            .select({
                orderCount: count(),
                revenue: sum(orders.totalAmount),
            })
            .from(orders)
            .where(and(eq(orders.storeId, id), eq(orders.paymentStatus, "paid")));

        return NextResponse.json({
            ...store,
            stats: {
                products: productCount?.count || 0,
                visits: visitCount?.count || 0,
                orders: sales?.orderCount || 0,
                revenue: Number(sales?.revenue || 0),
            },
        });
    } catch (error) {
        console.error("Store Detail API Error:", error);
        return NextResponse.json({ error: "Failed to fetch store details" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, deliveryProviderPhone } = body;

    try {
        await db
            .update(stores)
            .set({
                ...(status !== undefined ? { status } : {}),
                ...(deliveryProviderPhone !== undefined ? { deliveryProviderPhone } : {}),
            })
            .where(eq(stores.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Store API Error:", error);
        return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
    }
}
