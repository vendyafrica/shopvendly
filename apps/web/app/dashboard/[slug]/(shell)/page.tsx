import Link from "next/link";

import { SegmentedStatsCard } from "@/features/dashboard/components/segmented-stats-card";
import { RevenueAreaChartCard, TopProductsBarChartCard } from "@/features/dashboard/components/dynamic-charts";
import { RecentTransactionsTable } from "@/features/dashboard/components/recent-transactions-table";
import { db } from "@shopvendly/db/db";
import { orderItems, orders, stores } from "@shopvendly/db/schema";
import { and, desc, eq, isNull, sql } from "@shopvendly/db";
import { Button } from "@shopvendly/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { getStorefrontUrl } from "@/utils/misc";


function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function toChartDateLabel(date: string) {
  // Input is YYYY-MM-DD. Keep it short for the X axis.
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const basePath = `/dashboard/${slug}`;

  const store = await db.query.stores.findFirst({
    where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
    columns: { id: true, tenantId: true, name: true, defaultCurrency: true },
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

  const [paidKpis, customerAgg] = await Promise.all([
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
  ]);

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

  const statusCounts = recentOrders.reduce(
    (acc, order) => {
      if (order.paymentStatus === "paid") acc.paid += 1;
      else if (order.paymentStatus === "failed") acc.failed += 1;
      else acc.pending += 1;
      return acc;
    },
    { paid: 0, pending: 0, failed: 0 }
  );

  const lastOrder = recentOrders[0];

  const statSegments = [
    {
      label: "Total Revenue",
      value: formatCurrency(paidKpis.revenuePaid, currency),
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
      value: "—",
      changeLabel: "",
      changeTone: "neutral" as const,
    },
  ];

  const quickActions = [
    {
      title: "Add products",
      description: "Upload new inventory and keep your catalog fresh.",
      href: `${basePath}/products`,
    },
    {
      title: "Launch a collection",
      description: "Curate drops from Studio in a few clicks.",
      href: `${basePath}/studio`,
    },
    {
      title: "Manage orders",
      description: "Track fulfillment and payment status at a glance.",
      href: `${basePath}/transactions`,
    },
    {
      title: "Share your store",
      description: "Copy your live storefront link and promote it.",
      href: storefrontUrl,
      external: true,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Quick actions</h2>
          <p className="text-sm text-muted-foreground">Handle the most common tasks right from Home.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="border border-border/70 shadow-sm transition hover:border-primary/40">
              <CardHeader>
                <CardTitle>{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button size="sm" variant="secondary">
                  <Link href={action.href} target={action.external ? "_blank" : undefined} rel={action.external ? "noreferrer" : undefined}>
                    {action.external ? "Open store" : "Open"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-border/70 shadow-sm">
          <CardHeader className="flex flex-col space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{store.name}</CardTitle>
                <CardDescription className="truncate">{storefrontUrl}</CardDescription>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Live</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Share your storefront or jump into Studio to tweak the look & feel.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">
                <Link href={storefrontUrl} target="_blank" rel="noreferrer">
                  View store
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Link href={`${basePath}/studio`}>
                  Open Studio
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Orders snapshot</CardTitle>
            <CardDescription>Activity from the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="text-2xl font-semibold">{statusCounts.paid}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pending</dt>
                <dd className="text-2xl font-semibold">{statusCounts.pending}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Failed</dt>
                <dd className="text-2xl font-semibold">{statusCounts.failed}</dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="link" className="px-0">
              <Link href={`${basePath}/transactions`}>Go to Orders</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Total revenue collected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold">{formatCurrency(paidKpis.revenuePaid, currency)}</p>
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              {lastOrder ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Most recent order</p>
                  <p className="font-medium">{lastOrder.customerName || "New customer"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(lastOrder.totalAmount, lastOrder.currency || currency)} · {new Date(lastOrder.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No transactions yet</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="link" className="px-0">
              <Link href={`${basePath}/transactions`}>View transactions</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <SegmentedStatsCard segments={statSegments} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-7 lg:grid-cols-7">
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

      <RecentTransactionsTable rows={transactionRows} />
    </div>
  );
}
