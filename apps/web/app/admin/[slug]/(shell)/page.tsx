import Link from "next/link";
import { type ReactNode } from "react";

import { SegmentedStatsCard } from "@/app/admin/components/segmented-stats-card";
import { RevenueAreaChartCard, TopProductsBarChartCard } from "@/app/admin/components/dynamic-charts";
import { RecentTransactionsTable } from "@/app/admin/components/recent-transactions-table";
import { IntegrationsPanel } from "@/app/admin/components/integrations-panel";
import { QuickAddLauncher } from "@/app/admin/components/quick-add-launcher";
import { SocialConnectPrompt } from "@/app/admin/components/social-connect-prompt";
import { db } from "@shopvendly/db/db";
import { orderItems, orders, storefrontSessions, stores } from "@shopvendly/db/schema";
import { and, desc, eq, isNull, sql } from "@shopvendly/db";
import { Button } from "@shopvendly/ui/components/button";
import { Card, CardContent, CardHeader } from "@shopvendly/ui/components/card";
import { getStorefrontUrl } from "@/utils/misc";
import {
  Add01Icon,
  ShoppingBag01Icon,
  Invoice01Icon,
  Notification01Icon,
  Share01Icon,
  CheckmarkCircle01Icon,
  Link01Icon,
  Image01Icon,
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

  const [paidKpis, customerAgg, trafficTotals] = await Promise.all([
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
        distinctCustomers: sql<number>`COALESCE(COUNT(DISTINCT ${orders.customerEmail}), 0)::int`,
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
  ]);

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
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Paid Orders",
      value: paidKpis.ordersPaid.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Customers",
      value: customerAgg.distinctCustomers.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Conversion Rate",
      value: conversionRateLabel,
      changeLabel: "",
      changeTone: "neutral" as const,
    },
  ];

  const featuredOrder = recentOrders[0];
  const featuredItemName = featuredOrder?.items?.[0]?.productName;
  const featuredItemValue = featuredOrder
    ? formatCurrency(featuredOrder.totalAmount, featuredOrder.currency || currency)
    : undefined;

  const quickActions = [
    { label: "Add product", href: `${basePath}/products?quickAdd=1`, icon: Add01Icon },
    { label: "Orders", href: `${basePath}/transactions`, icon: Invoice01Icon },
    { label: "Products", href: `${basePath}/products`, icon: ShoppingBag01Icon },
    { label: "Notifications", href: `${basePath}/notifications`, icon: Notification01Icon },
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
        <div className="grid grid-cols-2 gap-3 px-1">
          <QuickAddLauncher className="h-14 w-full justify-start" label="Add product" />
          {quickActions.slice(1, 3).map((action) => (
            <Link
              key={action.label}
              href={action.href}
              target={action.external ? "_blank" : undefined}
              rel={action.external ? "noreferrer" : undefined}
              className="flex h-14 items-center gap-3 rounded-xl border bg-card/80 px-4 py-3 shadow-sm transition hover:bg-muted/60"
            >
              <HugeiconsIcon icon={action.icon} className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{action.label}</span>
            </Link>
          ))}
          <SocialConnectPrompt className="h-14" />
        </div>

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

      {/* Desktop-first cards and charts */}
      <Card className="bg-muted/20 shadow-sm hidden md:block">
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
          <div className="grid gap-6 md:grid-cols-2 min-h-[480px]">
            <div className="flex h-full flex-col rounded-3xl border border-dashed bg-background p-6 shadow-sm">
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/40 p-16 min-h-[260px]">
                <HugeiconsIcon icon={Image01Icon} className="h-10 w-10 text-muted-foreground" />
                <p className="mt-4 font-semibold">{featuredItemName || "Add your first product"}</p>
                <p className="text-sm text-muted-foreground">{featuredItemValue || "Upload an item to showcase it on your storefront."}</p>
              </div>
              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4" />
                  {featuredItemName ? "Product added" : "No product yet"}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" >
                    <Link href={`${basePath}/products`}>Add more</Link>
                  </Button>
                  <Button size="sm" variant="outline" >
                    <Link href={`${basePath}/products`}>View products</Link>
                  </Button>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border bg-background p-6 shadow-sm">
              <IntegrationsPanel variant="compact" />
            </div>
          </div>
        </CardContent>
      </Card>
      
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
