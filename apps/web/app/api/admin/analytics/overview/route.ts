import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import {
  orders,
  products,
  storefrontEvents,
  storefrontSessions,
  stores,
  tenantMemberships,
} from "@shopvendly/db/schema";
import { and, desc, eq, isNull, sql } from "@shopvendly/db";

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, session.user.id),
      columns: { tenantId: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug");

    if (!storeSlug) {
      return NextResponse.json({ error: "Missing storeSlug" }, { status: 400 });
    }

    const store = await db.query.stores.findFirst({
      where: and(eq(stores.slug, storeSlug), eq(stores.tenantId, membership.tenantId), isNull(stores.deletedAt)),
      columns: { id: true, tenantId: true, defaultCurrency: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const now = new Date();
    const from = parseDate(searchParams.get("from"), new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    const to = parseDate(searchParams.get("to"), now);

    const wherePaidOrders = and(
      eq(orders.tenantId, store.tenantId),
      eq(orders.storeId, store.id),
      eq(orders.paymentStatus, "paid"),
      isNull(orders.deletedAt),
      sql`${orders.createdAt} >= ${from}`,
      sql`${orders.createdAt} <= ${to}`
    );

    const [kpiPaid] = await db
      .select({
        revenuePaid: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
        ordersPaid: sql<number>`COALESCE(COUNT(*), 0)::int`,
      })
      .from(orders)
      .where(wherePaidOrders);

    const [kpiRefunds] = await db
      .select({
        refunds: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, store.tenantId),
          eq(orders.storeId, store.id),
          eq(orders.paymentStatus, "refunded"),
          isNull(orders.deletedAt),
          sql`${orders.createdAt} >= ${from}`,
          sql`${orders.createdAt} <= ${to}`
        )
      );

    const aov = kpiPaid?.ordersPaid ? Math.round((kpiPaid.revenuePaid || 0) / kpiPaid.ordersPaid) : 0;

    const timeseriesRevenue = await db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
        revenuePaid: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
        ordersPaid: sql<number>`COALESCE(COUNT(*), 0)::int`,
      })
      .from(orders)
      .where(wherePaidOrders)
      .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
      .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

    const whereSessionsInRange = and(
      eq(storefrontSessions.tenantId, store.tenantId),
      eq(storefrontSessions.storeId, store.id),
      sql`${storefrontSessions.lastSeenAt} >= ${from}`,
      sql`${storefrontSessions.lastSeenAt} <= ${to}`
    );

    const [trafficTotals] = await db
      .select({
        visits: sql<number>`COALESCE(COUNT(*), 0)::int`,
        uniqueVisitors: sql<number>`COALESCE(COUNT(DISTINCT ${storefrontSessions.sessionId}), 0)::int`,
        returningVisitors: sql<number>`COALESCE(SUM(CASE WHEN ${storefrontSessions.firstSeenAt} < ${from} THEN 1 ELSE 0 END), 0)::int`,
      })
      .from(storefrontSessions)
      .where(whereSessionsInRange);

    const visitsTimeseries = await db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${storefrontSessions.lastSeenAt}), 'YYYY-MM-DD')`,
        visits: sql<number>`COALESCE(COUNT(*), 0)::int`,
        uniqueVisitors: sql<number>`COALESCE(COUNT(DISTINCT ${storefrontSessions.sessionId}), 0)::int`,
      })
      .from(storefrontSessions)
      .where(whereSessionsInRange)
      .groupBy(sql`date_trunc('day', ${storefrontSessions.lastSeenAt})`)
      .orderBy(sql`date_trunc('day', ${storefrontSessions.lastSeenAt})`);

    const topViewed = await db
      .select({
        productId: storefrontEvents.productId,
        productName: products.productName,
        count: sql<number>`COALESCE(COUNT(*), 0)::int`,
      })
      .from(storefrontEvents)
      .leftJoin(products, eq(products.id, storefrontEvents.productId))
      .where(
        and(
          eq(storefrontEvents.tenantId, store.tenantId),
          eq(storefrontEvents.storeId, store.id),
          eq(storefrontEvents.eventType, "product_view"),
          sql`${storefrontEvents.createdAt} >= ${from}`,
          sql`${storefrontEvents.createdAt} <= ${to}`
        )
      )
      .groupBy(storefrontEvents.productId, products.productName)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5);

    const topAddToCart = await db
      .select({
        productId: storefrontEvents.productId,
        productName: products.productName,
        count: sql<number>`COALESCE(COUNT(*), 0)::int`,
      })
      .from(storefrontEvents)
      .leftJoin(products, eq(products.id, storefrontEvents.productId))
      .where(
        and(
          eq(storefrontEvents.tenantId, store.tenantId),
          eq(storefrontEvents.storeId, store.id),
          eq(storefrontEvents.eventType, "add_to_cart"),
          sql`${storefrontEvents.createdAt} >= ${from}`,
          sql`${storefrontEvents.createdAt} <= ${to}`
        )
      )
      .groupBy(storefrontEvents.productId, products.productName)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5);

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      currency: store.defaultCurrency || "USD",
      kpis: {
        revenuePaid: kpiPaid?.revenuePaid || 0,
        ordersPaid: kpiPaid?.ordersPaid || 0,
        aov,
        refunds: kpiRefunds?.refunds || 0,
      },
      timeseries: timeseriesRevenue,
      traffic: {
        visits: trafficTotals?.visits || 0,
        uniqueVisitors: trafficTotals?.uniqueVisitors || 0,
        returningVisitors: trafficTotals?.returningVisitors || 0,
        timeseries: visitsTimeseries,
      },
      topViewed,
      topAddToCart,
    });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
