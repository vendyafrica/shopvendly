import { db } from "@shopvendly/db/db";
import { tenants, stores, orders, storefrontSessions } from "@shopvendly/db/schema";
import { count, eq, gte, sum, desc, sql, and } from "@shopvendly/db";
import { TTL, withCache } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "../../../lib/auth-guard";

export async function GET() {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    try {
        const data = await withCache(
            "admin:admin:super_admin",
            async () => {
                const now = new Date();
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                // 1. Tenant Metrics
                const [totalTenants] = await db.select({ count: count() }).from(tenants);
                const totalTenantsCount = (totalTenants ?? { count: 0 }).count;

                const [newTenants7d] = await db
                    .select({ count: count() })
                    .from(tenants)
                    .where(gte(tenants.createdAt, sevenDaysAgo));
                const newTenants7dCount = (newTenants7d ?? { count: 0 }).count;

                const [newTenants30d] = await db
                    .select({ count: count() })
                    .from(tenants)
                    .where(gte(tenants.createdAt, thirtyDaysAgo));
                const newTenants30dCount = (newTenants30d ?? { count: 0 }).count;

                // 2. Store Metrics
                const [totalStores] = await db.select({ count: count() }).from(stores);
                const totalStoresCount = (totalStores ?? { count: 0 }).count;

                const [activeStores] = await db
                    .select({ count: count() })
                    .from(stores)
                    .where(eq(stores.status, true));
                const activeStoresCount = (activeStores ?? { count: 0 }).count;

                const [inactiveStores] = await db
                    .select({ count: count() })
                    .from(stores)
                    .where(eq(stores.status, false));
                const inactiveStoresCount = (inactiveStores ?? { count: 0 }).count;

                // 3. Marketplace Metrics
                // GMV (Paid Orders)
                const [gmvResult] = await db
                    .select({ total: sum(orders.totalAmount) })
                    .from(orders)
                    .where(eq(orders.paymentStatus, "paid"));
                const gmv = Number(gmvResult?.total || 0);

                const revenueSeriesRaw = await db
                    .select({
                        date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
                        total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
                    })
                    .from(orders)
                    .where(and(gte(orders.createdAt, thirtyDaysAgo), eq(orders.paymentStatus, "paid")))
                    .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
                    .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

                const [totalOrders] = await db.select({ count: count() }).from(orders);
                const totalOrdersCount = (totalOrders ?? { count: 0 }).count;

                const topStoresByOrders = await db
                    .select({
                        storeId: orders.storeId,
                        storeName: stores.name,
                        orders: count(),
                    })
                    .from(orders)
                    .leftJoin(stores, eq(orders.storeId, stores.id))
                    .where(and(gte(orders.createdAt, thirtyDaysAgo), eq(orders.paymentStatus, "paid")))
                    .groupBy(orders.storeId, stores.name)
                    .orderBy(desc(count()))
                    .limit(5);
                // 4. Top Stores by Revenue
                const topStoresByRevenue = await db
                    .select({
                        storeId: orders.storeId,
                        storeName: stores.name,
                        revenue: sum(orders.totalAmount).mapWith(Number),
                    })
                    .from(orders)
                    .leftJoin(stores, eq(orders.storeId, stores.id))
                    .where(and(gte(orders.createdAt, thirtyDaysAgo), eq(orders.paymentStatus, "paid")))
                    .groupBy(orders.storeId, stores.name)
                    .orderBy(desc(sum(orders.totalAmount)))
                    .limit(5);

                // 5. Top Stores by Visits
                const topStoresByVisits = await db
                    .select({
                        storeId: storefrontSessions.storeId,
                        storeName: stores.name,
                        visits: count(),
                    })
                    .from(storefrontSessions)
                    .leftJoin(stores, eq(storefrontSessions.storeId, stores.id))
                    .groupBy(storefrontSessions.storeId, stores.name)
                    .orderBy(desc(count()))
                    .limit(5);

                return {
                    tenants: {
                        total: totalTenantsCount,
                        new7d: newTenants7dCount,
                        new30d: newTenants30dCount,
                    },
                    stores: {
                        total: totalStoresCount,
                        active: activeStoresCount,
                        inactive: inactiveStoresCount,
                    },
                    marketplace: {
                        gmv: gmv,
                        totalOrders: totalOrdersCount,
                    },
                    revenueSeries: revenueSeriesRaw,
                    topStoresByOrders,
                    topStores: {
                        byRevenue: topStoresByRevenue,
                        byVisits: topStoresByVisits,
                    },
                };
            },
            TTL.SHORT
        );

        return NextResponse.json(data);
    } catch (error) {
        console.error("admin API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
