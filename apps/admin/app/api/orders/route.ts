import { db } from "@shopvendly/db/db";
import { orders, tenants, stores } from "@shopvendly/db/schema";
import { eq, desc, and } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";

export async function GET(req: Request) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const paymentStatus = searchParams.get("paymentStatus");

    try {
        const filters = [] as ReturnType<typeof eq>[];
        if (storeId) filters.push(eq(orders.storeId, storeId));
        if (paymentStatus) filters.push(eq(orders.paymentStatus, paymentStatus));

        const whereClause = filters.reduce((acc, clause) => (acc ? and(acc, clause) : clause), undefined as ReturnType<typeof eq> | undefined);

        const data = await db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                status: orders.status,
                paymentStatus: orders.paymentStatus,
                totalAmount: orders.totalAmount,
                currency: orders.currency,
                createdAt: orders.createdAt,
                storeName: stores.name,
                tenantName: tenants.fullName,
            })
            .from(orders)
            .leftJoin(stores, eq(orders.storeId, stores.id))
            .leftJoin(tenants, eq(orders.tenantId, tenants.id))
            .where(whereClause)
            .orderBy(desc(orders.createdAt))
            .limit(100); // Limit for performance

        return NextResponse.json(data);
    } catch (error) {
        console.error("Orders API Error:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
