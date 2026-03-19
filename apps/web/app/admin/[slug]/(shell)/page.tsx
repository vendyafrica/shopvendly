import Link from "next/link";
import { type ReactNode } from "react";


import { RevenueAreaChartCard, TopProductsBarChartCard } from "@/app/admin/components/dynamic-charts";
import { RecentTransactionsTable } from "@/app/admin/components/recent-transactions-table";
import { IntegrationsPanel } from "@/app/admin/components/integrations-panel";
import { QuickAddLauncher } from "@/app/admin/components/quick-add-launcher";
import { SimpleLineChartCard } from "@/app/admin/components/simple-line-chart-card";
import { QuickActionsGrid } from "@/app/admin/components/quick-actions-grid";
import { db } from "@shopvendly/db/db";
import { orderItems, orders, products, storefrontSessions, stores } from "@shopvendly/db/schema";
import { and, count, desc, eq, isNull, sql } from "@shopvendly/db";
import { Card, CardContent, CardHeader } from "@shopvendly/ui/components/card";
import { getStorefrontUrl } from "@/utils/misc";
import {
  Add01Icon,
  ShoppingBag01Icon,
  Invoice01Icon,
  Share01Icon,
  Link01Icon,
  ArrowRight01Icon,
  AnalyticsDownIcon,
  AnalyticsUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@shopvendly/ui/components/badge";


function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatStatCurrency(amount: number, currency: string): ReactNode {
  const formatted = formatCurrency(amount, currency);
  const match = formatted.match(/^([A-Z]{3})[\s\u00a0]*(.*)$/);
  if (!match) return formatted;
  const [, code, numeric] = match;
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-xs font-semibold text-muted-foreground align-sub tracking-tight">{code}</span>
      <span>{numeric}</span>
    </span>
  );
}

function toChartDateLabel(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const basePath = `/admin/${slug}`;

  const store = await db.query.stores.findFirst({
    where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
    columns: { id: true, tenantId: true, name: true, defaultCurrency: true, slug: true },
  });

  if (!store) {
    return (
      <div className="space-y-6">
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          Store not found.
        </div>
      </div>
    );
  }

  const currency = store.defaultCurrency || "UGX";
  const storefrontUrl = getStorefrontUrl(slug);
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  const prevTo = new Date(from.getTime());
  const prevFrom = new Date(prevTo.getTime() - 30 * 24 * 60 * 60 * 1000);

  const wherePaidOrders = and(
    eq(orders.tenantId, store.tenantId),
    eq(orders.storeId, store.id),
    eq(orders.paymentStatus, "paid"),
    isNull(orders.deletedAt),
    sql`${orders.createdAt} >= ${from}`,
    sql`${orders.createdAt} <= ${to}`
  );

  const whereSessionsInRange = and(
    eq(storefrontSessions.tenantId, store.tenantId),
    eq(storefrontSessions.storeId, store.id),
    sql`${storefrontSessions.lastSeenAt} >= ${from}`,
    sql`${storefrontSessions.lastSeenAt} <= ${to}`
  );

  const wherePrevOrders = and(
    eq(orders.tenantId, store.tenantId),
    eq(orders.storeId, store.id),
    eq(orders.paymentStatus, "paid"),
    isNull(orders.deletedAt),
    sql`${orders.createdAt} >= ${prevFrom}`,
    sql`${orders.createdAt} <= ${prevTo}`
  );

  const [paidKpis, customerAgg, trafficTotals, prevKpis, productCount] = await Promise.all([
    db
      .select({
        revenuePaid: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
        ordersPaid: sql<number>`COALESCE(COUNT(*), 0)::int`,
      })
      .from(orders)
      .where(wherePaidOrders)
      .then((rows) => rows[0] ?? { revenuePaid: 0, ordersPaid: 0 }),

    db
      .select({
        distinctCustomers: sql<number>`COALESCE(COUNT(DISTINCT COALESCE(${orders.customerEmail}, ${orders.customerPhone})), 0)::int`,
      })
      .from(orders)
      .where(wherePaidOrders)
      .then((rows) => rows[0] ?? { distinctCustomers: 0 }),

    db
      .select({
        visits: sql<number>`COALESCE(SUM(${storefrontSessions.visitCount}), 0)::int`,
        uniqueVisitors: sql<number>`COALESCE(COUNT(DISTINCT ${storefrontSessions.sessionId}), 0)::int`,
      })
      .from(storefrontSessions)
      .where(whereSessionsInRange)
      .then((rows) => rows[0] ?? { visits: 0, uniqueVisitors: 0 }),

    // Previous period for trends
    db
      .select({
        revenuePaid: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
        ordersPaid: sql<number>`COALESCE(COUNT(*), 0)::int`,
        distinctCustomers: sql<number>`COALESCE(COUNT(DISTINCT COALESCE(${orders.customerEmail}, ${orders.customerPhone})), 0)::int`,
      })
      .from(orders)
      .where(wherePrevOrders)
      .then((rows) => rows[0] ?? { revenuePaid: 0, ordersPaid: 0, distinctCustomers: 0 }),

    // Product count for onboarding vs active hero
    db
      .select({ value: count() })
      .from(products)
      .where(and(eq(products.tenantId, store.tenantId), isNull(products.deletedAt)))
      .then((rows) => rows[0]?.value ?? 0),
  ]);

  // Trend helpers
  function trendLabel(curr: number, prev: number): string {
    if (prev === 0) return curr > 0 ? `+${curr}` : "";
    const pct = ((curr - prev) / prev) * 100;
    return pct >= 0 ? `+${pct.toFixed(0)}%` : `${pct.toFixed(0)}%`;
  }
  function trendTone(curr: number, prev: number): "positive" | "negative" | "neutral" {
    if (prev === 0 && curr === 0) return "neutral";
    return curr >= prev ? "positive" : "negative";
  }

  const conversionRate = trafficTotals.visits > 0 ? (paidKpis.ordersPaid / trafficTotals.visits) * 100 : null;
  const conversionRateLabel = conversionRate === null ? "—" : `${conversionRate.toFixed(1)}%`;

  const revenueSeriesRaw = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
    })
    .from(orders)
    .where(wherePaidOrders)
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

  const revenueTotalsByDate = new Map(revenueSeriesRaw.map((row) => [row.date, row.total]));
  const revenueSeries = Array.from({ length: 31 }).map((_, index) => {
    const day = new Date(from.getTime());
    day.setDate(from.getDate() + index);
    const isoDate = day.toISOString().slice(0, 10);
    return {
      date: toChartDateLabel(isoDate),
      total: revenueTotalsByDate.get(isoDate) ?? 0,
    };
  });

  const ordersSeriesRaw = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      total: sql<number>`COALESCE(COUNT(*), 0)::int`,
    })
    .from(orders)
    .where(wherePaidOrders)
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

  const ordersTotalsByDate = new Map(ordersSeriesRaw.map((row) => [row.date, row.total]));
  const ordersSeries = Array.from({ length: 31 }).map((_, index) => {
    const day = new Date(from.getTime());
    day.setDate(from.getDate() + index);
    const isoDate = day.toISOString().slice(0, 10);
    return {
      date: toChartDateLabel(isoDate),
      total: ordersTotalsByDate.get(isoDate) ?? 0,
    };
  });

  const topProductsRaw = await db
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
    .limit(5);

  const topProducts = topProductsRaw.map((row) => ({
    product: row.product,
    sales: row.sales,
  }));

  const recentOrders = await db.query.orders.findMany({
    where: and(eq(orders.tenantId, store.tenantId), eq(orders.storeId, store.id), isNull(orders.deletedAt)),
    with: { items: { columns: { productName: true } } },
    orderBy: [desc(orders.createdAt)],
    limit: 8,
    columns: {
      id: true,
      orderNumber: true,
      customerName: true,
      paymentStatus: true,
      paymentMethod: true,
      totalAmount: true,
      currency: true,
      createdAt: true,
    },
  });

  const transactionRows = recentOrders.map((o) => {
    const itemLabel =
      o.items?.length === 1
        ? o.items[0]?.productName
        : o.items?.length
          ? `${o.items.length} items`
          : "—";

    const status =
      o.paymentStatus === "paid"
        ? "Completed"
        : o.paymentStatus === "failed"
          ? "Failed"
          : "Pending";

    const orderCurrency = o.currency || currency;

    return {
      id: o.orderNumber,
      customer: o.customerName,
      product: itemLabel || "—",
      amount: formatCurrency(o.totalAmount, orderCurrency),
      status: status as "Completed" | "Failed" | "Pending",
      payment: o.paymentMethod,
      date: new Date(o.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  });

  const statSegments = [
    {
      label: "Total Revenue",
      value: formatStatCurrency(paidKpis.revenuePaid, currency),
      changeLabel: trendLabel(paidKpis.revenuePaid, prevKpis.revenuePaid),
      changeTone: trendTone(paidKpis.revenuePaid, prevKpis.revenuePaid),
    },
    {
      label: "Paid Orders",
      value: paidKpis.ordersPaid.toLocaleString(),
      changeLabel: trendLabel(paidKpis.ordersPaid, prevKpis.ordersPaid),
      changeTone: trendTone(paidKpis.ordersPaid, prevKpis.ordersPaid),
    },
    {
      label: "Customers",
      value: customerAgg.distinctCustomers.toLocaleString(),
      changeLabel: trendLabel(customerAgg.distinctCustomers, prevKpis.distinctCustomers),
      changeTone: trendTone(customerAgg.distinctCustomers, prevKpis.distinctCustomers),
    },
    {
      label: "Conversion Rate",
      value: conversionRateLabel,
      changeLabel: "",
      changeTone: "neutral" as const,
    },
  ];

  const hasProducts = productCount > 0;
  const quickActions = [
    { label: "Add product", href: `${basePath}/products?quickAdd=1`, icon: Add01Icon },
    { label: "Orders", href: `${basePath}/transactions`, icon: Invoice01Icon },
    { label: "Products", href: `${basePath}/products`, icon: ShoppingBag01Icon },
    { label: "Share store", href: storefrontUrl, icon: Share01Icon, external: true },
  ];

  const activityItems = transactionRows.slice(0, 6).map((tx) => ({
    id: tx.id,
    title: tx.customer || "New customer",
    subtitle: tx.product,
    amount: tx.amount,
    status: tx.status,
    time: tx.date,
  }));

  return (
    <div className="space-y-6">
      <div className="flex md:hidden flex-col gap-5">
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 min-w-0">
            <Link
              href={storefrontUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              <HugeiconsIcon icon={Link01Icon} className="size-3.5" />
              <span className="truncate">{storefrontUrl.replace(/^https?:\/\//, "")}</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-1">
          {statSegments.slice(0, 4).map((s) => (
            <div key={s.label} className="rounded-xl border bg-card/80 px-4 py-3 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">{s.label}</p>
              <p className="text-xl font-medium mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <QuickAddLauncher
          layout="grid"
          className="px-1"
          actions={quickActions.slice(1, 3)}
          socialConnect={{ enabled: true }}
        />
      </div>

      <div className="hidden md:flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon icon={Link01Icon} className="size-4" />
              <Link href={storefrontUrl} target="_blank" className="hover:text-primary transition-colors">
                {storefrontUrl.replace(/^https?:\/\//, "")}
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
          <div className="md:col-span-5 lg:col-span-4">
            <QuickActionsGrid basePath={basePath} storefrontUrl={storefrontUrl} />
          </div>
          <div className="md:col-span-7 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
            <SimpleLineChartCard
              title="30-Day Revenue"
              value={formatCurrency(paidKpis.revenuePaid, currency)}
              data={revenueSeries}
              trend={trendLabel(paidKpis.revenuePaid, prevKpis.revenuePaid)}
              trendTone={trendTone(paidKpis.revenuePaid, prevKpis.revenuePaid)}
            />
            <SimpleLineChartCard
              title="Paid Orders"
              value={paidKpis.ordersPaid.toLocaleString()}
              data={ordersSeries}
              trend={trendLabel(paidKpis.ordersPaid, prevKpis.ordersPaid)}
              trendTone={trendTone(paidKpis.ordersPaid, prevKpis.ordersPaid)}
            />
          </div>
        </div>



        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
          <RevenueAreaChartCard
            className="md:col-span-8 lg:col-span-8"
            title="Revenue Performance"
            totalLabel={formatCurrency(paidKpis.revenuePaid, currency)}
            data={revenueSeries}
          />
          <TopProductsBarChartCard
            className="md:col-span-4 lg:col-span-4"
            title="Top Products"
            description="Active in the last 30 days"
            totalLabel={topProducts.reduce((acc, p) => acc + p.sales, 0).toLocaleString()}
            data={topProducts}
          />
        </div>

        <RecentTransactionsTable rows={transactionRows} />
      </div>

      <div className="md:hidden space-y-4 px-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Recent transactions</p>
          <Badge variant="outline" className="text-[10px] rounded-md font-bold uppercase tracking-wider">Live</Badge>
        </div>
        {activityItems.length === 0 ? (
          <div className="rounded-xl border bg-card/80 px-4 py-8 text-center text-sm text-muted-foreground">
            No transactions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {activityItems.map((item) => (
              <div key={item.id} className="rounded-xl border bg-card/80 px-4 py-3 shadow-sm flex items-center gap-3">
                <div className="size-10 rounded-full border flex items-center justify-center bg-primary/5 text-primary">
                  <HugeiconsIcon icon={Invoice01Icon} className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{item.amount}</p>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/60">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
