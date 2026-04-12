import { db } from "@shopvendly/db/db";
import { orders, storefrontSessions, storefrontEvents, products } from "@shopvendly/db/schema";
import { and, desc, eq, isNull, sql } from "@shopvendly/db";

export const analyticsRepo = {
  async getKpiTotals(store: { id: string; tenantId: string }, { from, to }: { from: Date; to: Date }) {
    const wherePaid = and(
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
        distinctCustomers: sql<number>`COALESCE(COUNT(DISTINCT COALESCE(${orders.customerEmail}, ${orders.customerPhone})), 0)::int`,
      })
      .from(orders)
      .where(wherePaid);

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

    return {
      revenuePaid: kpiPaid?.revenuePaid || 0,
      ordersPaid: kpiPaid?.ordersPaid || 0,
      distinctCustomers: kpiPaid?.distinctCustomers || 0,
      aov,
      refunds: kpiRefunds?.refunds || 0,
      grossSales: kpiPaid?.revenuePaid || 0,
      discounts: 0,
      shippingCharges: 0,
      taxes: 0,
    };
  },

  async getRevenueTimeseries(store: { id: string; tenantId: string }, { from, to, interval = "day" }: { from: Date; to: Date; interval?: "day" | "hour" }) {
    const isHour = interval === "hour";
    const dateSql = isHour ? sql<string>`to_char(date_trunc('hour', ${orders.createdAt}), 'YYYY-MM-DD HH24:00')` : sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`;
    const groupSql = isHour ? sql`date_trunc('hour', ${orders.createdAt})` : sql`date_trunc('day', ${orders.createdAt})`;

    return db
      .select({
        date: dateSql,
        revenuePaid: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
        ordersPaid: sql<number>`COALESCE(COUNT(*), 0)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, store.tenantId),
          eq(orders.storeId, store.id),
          eq(orders.paymentStatus, "paid"),
          isNull(orders.deletedAt),
          sql`${orders.createdAt} >= ${from}`,
          sql`${orders.createdAt} <= ${to}`
        )
      )
      .groupBy(groupSql)
      .orderBy(groupSql);
  },

  async getTrafficTotals(store: { id: string; tenantId: string }, { from, to }: { from: Date; to: Date }) {
    const [totals] = await db
      .select({
        visits: sql<number>`COALESCE(COUNT(*), 0)::int`,
        uniqueVisitors: sql<number>`COALESCE(COUNT(DISTINCT ${storefrontSessions.sessionId}), 0)::int`,
        returningVisitors: sql<number>`COALESCE(SUM(CASE WHEN ${storefrontSessions.firstSeenAt} < ${from} THEN 1 ELSE 0 END), 0)::int`,
      })
      .from(storefrontSessions)
      .where(
        and(
          eq(storefrontSessions.tenantId, store.tenantId),
          eq(storefrontSessions.storeId, store.id),
          sql`${storefrontSessions.lastSeenAt} >= ${from}`,
          sql`${storefrontSessions.lastSeenAt} <= ${to}`
        )
      );

    return {
      visits: totals?.visits || 0,
      uniqueVisitors: totals?.uniqueVisitors || 0,
      returningVisitors: totals?.returningVisitors || 0,
    };
  },

  async getTrafficTimeseries(store: { id: string; tenantId: string }, { from, to, interval = "day" }: { from: Date; to: Date; interval?: "day" | "hour" }) {
    const isHour = interval === "hour";
    const dateSql = isHour ? sql<string>`to_char(date_trunc('hour', ${storefrontSessions.lastSeenAt}), 'YYYY-MM-DD HH24:00')` : sql<string>`to_char(date_trunc('day', ${storefrontSessions.lastSeenAt}), 'YYYY-MM-DD')`;
    const groupSql = isHour ? sql`date_trunc('hour', ${storefrontSessions.lastSeenAt})` : sql`date_trunc('day', ${storefrontSessions.lastSeenAt})`;

    return db
      .select({
        date: dateSql,
        visits: sql<number>`COALESCE(COUNT(*), 0)::int`,
        uniqueVisitors: sql<number>`COALESCE(COUNT(DISTINCT ${storefrontSessions.sessionId}), 0)::int`,
      })
      .from(storefrontSessions)
      .where(
        and(
          eq(storefrontSessions.tenantId, store.tenantId),
          eq(storefrontSessions.storeId, store.id),
          sql`${storefrontSessions.lastSeenAt} >= ${from}`,
          sql`${storefrontSessions.lastSeenAt} <= ${to}`
        )
      )
      .groupBy(groupSql)
      .orderBy(groupSql);
  },

  async getTopProducts(
    store: { id: string; tenantId: string },
    { from, to, eventType, limit = 5 }: { from: Date; to: Date; eventType: string; limit?: number }
  ) {
    return db
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
          eq(storefrontEvents.eventType, eventType),
          sql`${storefrontEvents.createdAt} >= ${from}`,
          sql`${storefrontEvents.createdAt} <= ${to}`
        )
      )
      .groupBy(storefrontEvents.productId, products.productName)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);
  },
  async getTopProductsBySales(
    store: { id: string; tenantId: string },
    { from, to, limit = 5 }: { from: Date; to: Date; limit?: number }
  ) {
    // Note: This assumes orderItems is imported or available via schema
    const { orderItems } = await import("@shopvendly/db/schema");
    return db
      .select({
        product: orderItems.productName,
        sales: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::int`,
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.tenantId, store.tenantId),
          sql`${orderItems.createdAt} >= ${from}`,
          sql`${orderItems.createdAt} <= ${to}`
        )
      )
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(limit);
  },
};
