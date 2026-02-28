import Link from "next/link";

import { SegmentedStatsCard } from "@/features/dashboard/components/segmented-stats-card";
import { RevenueAreaChartCard, TopProductsBarChartCard } from "@/features/dashboard/components/dynamic-charts";
import { RecentTransactionsTable } from "@/features/dashboard/components/recent-transactions-table";
import { IntegrationsPanel } from "@/features/dashboard/components/integrations-panel";
import { db } from "@shopvendly/db/db";
import { orderItems, orders, stores } from "@shopvendly/db/schema";
import { and, desc, eq, isNull, sql } from "@shopvendly/db";
import { Button } from "@shopvendly/ui/components/button";
import { Card, CardContent, CardHeader } from "@shopvendly/ui/components/card";
import { Input } from "@shopvendly/ui/components/input";
import { getStorefrontUrl } from "@/utils/misc";
import { CheckCircle2, ExternalLink, ImageIcon, Palette } from "lucide-react";


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

  const featuredOrder = recentOrders[0];
  const featuredItemName = featuredOrder?.items?.[0]?.productName;
  const featuredItemValue = featuredOrder
    ? formatCurrency(featuredOrder.totalAmount, featuredOrder.currency || currency)
    : undefined;
  const designPrompt = featuredItemName ? `A store specializing in ${featuredItemName.toLowerCase()}.` : `A store specializing in ${store.name.toLowerCase()}.`;

  return (
    <div className="space-y-8">
      <Card className="bg-muted/20 shadow-sm">
        <CardHeader className="flex flex-col gap-2 pb-2 md:flex-row md:items-center md:justify-between">
          <Link
            href={storefrontUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-sm border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/60"
          >
            <ExternalLink className="h-4 w-4" />
            {storefrontUrl.replace(/^https?:\/\//, "")}
          </Link>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2 min-h-[480px]">
            <div className="flex h-full flex-col rounded-3xl border border-dashed bg-background p-6 shadow-sm">
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/40 p-16 min-h-[260px]">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                <p className="mt-4 font-semibold">{featuredItemName || "Add your first product"}</p>
                <p className="text-sm text-muted-foreground">{featuredItemValue || "Upload an item to showcase it on your storefront."}</p>
              </div>
              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
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
