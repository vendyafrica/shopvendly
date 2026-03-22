import { db } from "@shopvendly/db/db";
import { stores, tenants, products, orders, storefrontSessions } from "@shopvendly/db/schema";
import { eq, and, count, sum } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";
import { z } from "zod";

const updateStoreSchema = z.object({
    status: z.boolean().optional(),
    deliveryProviderPhone: z.string().trim().min(1).nullable().optional(),
    name: z.string().trim().min(1).optional(),
    slug: z.string().trim().min(1).optional(),
    collectoPassTransactionFeeToCustomer: z.boolean().optional(),
    collectoPayoutMode: z.enum(["automatic_per_order", "manual_batch"]).optional(),
});

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
                collectoPassTransactionFeeToCustomer: stores.collectoPassTransactionFeeToCustomer,
                collectoPayoutMode: stores.collectoPayoutMode,

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
    const parsed = updateStoreSchema.parse(body ?? {});

    try {
        await db
            .update(stores)
            .set({
                ...(parsed.status !== undefined ? { status: parsed.status } : {}),
                ...(parsed.deliveryProviderPhone !== undefined ? { deliveryProviderPhone: parsed.deliveryProviderPhone } : {}),
                ...(parsed.name !== undefined ? { name: parsed.name } : {}),
                ...(parsed.slug !== undefined ? { slug: parsed.slug } : {}),
                ...(parsed.collectoPassTransactionFeeToCustomer !== undefined
                    ? { collectoPassTransactionFeeToCustomer: parsed.collectoPassTransactionFeeToCustomer }
                    : {}),
                ...(parsed.collectoPayoutMode !== undefined
                    ? { collectoPayoutMode: parsed.collectoPayoutMode }
                    : {}),
            })
            .where(eq(stores.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Store API Error:", error);
        return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
    }
}
