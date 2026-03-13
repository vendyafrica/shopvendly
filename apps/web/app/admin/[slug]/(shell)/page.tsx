import Link from "next/link";
import { type ReactNode } from "react";

import { SegmentedStatsCard } from "@/app/admin/components/segmented-stats-card";
import { RevenueAreaChartCard, TopProductsBarChartCard } from "@/app/admin/components/dynamic-charts";
import { RecentTransactionsTable } from "@/app/admin/components/recent-transactions-table";
import { IntegrationsPanel } from "@/app/admin/components/integrations-panel";
import { QuickAddLauncher } from "@/app/admin/components/quick-add-launcher";
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
    <div className="space-y-8">
      {/* Mobile-first: profile header + stats + actions + activity */}
      <div className="md:hidden space-y-5">
        {/* Profile header */}
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

        {/* Stats row */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-1">
          {statSegments.map((s) => (
            <div key={s.label} className="min-w-[160px] rounded-xl border bg-card/80 px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-semibold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick actions 2x2 */}
        <QuickAddLauncher
          layout="grid"
          className="px-1"
          actions={quickActions.slice(1, 3)}
          socialConnect={{ enabled: true }}
        />

        {/* Activity feed (orders and product updates via transactions) */}
        <div className="space-y-3 px-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Recent activity</p>
            <Badge variant="outline" className="text-[11px] rounded-md">Live</Badge>
          </div>
          {activityItems.length === 0 ? (
            <div className="rounded-xl border bg-card/80 px-4 py-8 text-center text-sm text-muted-foreground">
              No recent activity yet.
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
                    <span className="text-[10px] uppercase text-muted-foreground">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* ── Desktop hero ─────────────────────────────────────────────────── */}
      <div className="hidden md:block">
        {hasProducts ? (
          /* ── ACTIVE STATE: performance strip + quick actions ─────────── */
          <div className="rounded-2xl border bg-card/60 shadow-sm overflow-hidden">
            {/* Top bar: storefront link + quick actions */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b bg-muted/30">
              <Link
                href={storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={Link01Icon} className="h-4 w-4 shrink-0" />
                <span className="truncate max-w-[260px]">{storefrontUrl.replace(/^https?:\/\//, "")}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className="h-3.5 w-3.5 opacity-50" />
              </Link>
              {/* Quick action buttons */}
              <QuickAddLauncher
                layout="inline"
                className="shrink-0"
                actions={quickActions.slice(1, 3)}
                socialConnect={{ enabled: true, variant: "compact" }}
                shareAction={quickActions[3]}
              />
            </div>

            {/* Performance strip */}
            <div className="grid grid-cols-3 divide-x">
              <div className="px-6 py-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">30-day Revenue</p>
                <p className="text-2xl font-bold tracking-tight">{formatStatCurrency(paidKpis.revenuePaid, currency)}</p>
                {trendLabel(paidKpis.revenuePaid, prevKpis.revenuePaid) && (
                  <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${paidKpis.revenuePaid >= prevKpis.revenuePaid ? "text-emerald-600" : "text-rose-500"}`}>
                    <HugeiconsIcon icon={paidKpis.revenuePaid >= prevKpis.revenuePaid ?AnalyticsUpIcon : AnalyticsDownIcon} className="h-3.5 w-3.5" />
                    {trendLabel(paidKpis.revenuePaid, prevKpis.revenuePaid)} vs prev 30d
                  </p>
                )}
              </div>
              <div className="px-6 py-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Paid Orders</p>
                <p className="text-2xl font-bold tracking-tight">{paidKpis.ordersPaid.toLocaleString()}</p>
                {trendLabel(paidKpis.ordersPaid, prevKpis.ordersPaid) && (
                  <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${paidKpis.ordersPaid >= prevKpis.ordersPaid ? "text-emerald-600" : "text-rose-500"}`}>
                    <HugeiconsIcon icon={paidKpis.ordersPaid >= prevKpis.ordersPaid ? AnalyticsUpIcon : AnalyticsDownIcon} className="h-3.5 w-3.5" />
                    {trendLabel(paidKpis.ordersPaid, prevKpis.ordersPaid)} vs prev 30d
                  </p>
                )}
              </div>
              <div className="px-6 py-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Customers</p>
                <p className="text-2xl font-bold tracking-tight">{customerAgg.distinctCustomers.toLocaleString()}</p>
                {trendLabel(customerAgg.distinctCustomers, prevKpis.distinctCustomers) && (
                  <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${customerAgg.distinctCustomers >= prevKpis.distinctCustomers ? "text-emerald-600" : "text-rose-500"}`}>
                    <HugeiconsIcon icon={customerAgg.distinctCustomers >= prevKpis.distinctCustomers ? AnalyticsUpIcon : AnalyticsDownIcon} className="h-3.5 w-3.5" />
                    {trendLabel(customerAgg.distinctCustomers, prevKpis.distinctCustomers)} vs prev 30d
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── ONBOARDING STATE: checklist for new stores ───────────────── */
          <Card className="bg-muted/20 shadow-sm">
            <CardHeader className="flex flex-col gap-2 pb-2 md:flex-row md:items-center md:justify-between">
              <Link
                href={storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/60"
              >
                <HugeiconsIcon icon={Link01Icon} className="h-4 w-4" />
                {storefrontUrl.replace(/^https?:\/\//, "")}
              </Link>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 md:grid-cols-2 min-h-[340px]">
                <div className="flex h-full flex-col gap-4 rounded-2xl border border-dashed bg-background p-6 shadow-sm">
                  <p className="text-base font-semibold">Get started with Vendly</p>
                  <p className="text-sm text-muted-foreground -mt-2">Complete these steps to make your first sale.</p>
                  <div className="flex flex-col gap-3 mt-2">
                    {[
                      { label: "Upload your first product", href: `${basePath}/products?quickAdd=1`, done: false },
                      { label: "Connect Instagram", href: `${basePath}/integrations`, done: false },
                      { label: "Share your store link", href: storefrontUrl, done: false, external: true },
                    ].map((step) => (
                      <Link
                        key={step.label}
                        href={step.href}
                        target={step.external ? "_blank" : undefined}
                        rel={step.external ? "noreferrer" : undefined}
                        className="flex items-center gap-3 rounded-xl border bg-muted/20 px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors group"
                      >
                        <div className="size-6 rounded-full border-2 border-dashed border-border flex items-center justify-center shrink-0 group-hover:border-primary/60 transition-colors" />
                        <span className="flex-1">{step.label}</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                  <IntegrationsPanel variant="compact" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <SegmentedStatsCard segments={statSegments} />


      <div className="hidden md:grid grid-cols-1 gap-5 md:grid-cols-7 lg:grid-cols-7">
        <RevenueAreaChartCard
          className="md:col-span-4"
          title="Total Revenue"
          totalLabel={formatCurrency(paidKpis.revenuePaid, currency)}
          data={revenueSeries}
        />
        <TopProductsBarChartCard
          className="md:col-span-3"
          title="Top Products"
          description="By sales volume"
          totalLabel={topProducts.reduce((acc, p) => acc + p.sales, 0).toLocaleString()}
          data={topProducts}
        />
      </div>
      <div className="hidden md:block">
        <RecentTransactionsTable rows={transactionRows} />
      </div>
    </div>
  );
}
