import { SegmentedStatsCard } from "@/app/admin/components/segmented-stats-card";
import { db } from "@shopvendly/db/db";
import { orders, stores } from "@shopvendly/db/schema";

import { and, desc, eq, isNull, sql } from "@shopvendly/db";
import { CustomersTable, type CustomerRow } from "./CustomersTable";
import { CustomersMobileView } from "./components/customers-mobile-view";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await db.query.stores.findFirst({
    where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
    columns: { id: true, tenantId: true, defaultCurrency: true, name: true, slug: true, logoUrl: true },
  });

  if (!store) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">Store not found.</div>
      </div>
    );
  }

  const bootstrap = {
    tenantId: store.tenantId,
    storeId: store.id,
    storeSlug: store.slug,
    storeName: store.name,
    storeLogoUrl: store.logoUrl ?? undefined,
    defaultCurrency: store.defaultCurrency ?? undefined,
  };

  const currency = bootstrap.defaultCurrency || "USD";
  const now = new Date();
  const newThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const churnThreshold = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const rowsAgg = await db
    .select({
      email: orders.customerEmail,
      name: sql<string>`MAX(${orders.customerName})`,
      orders: sql<number>`COALESCE(COUNT(*), 0)::int`,
      totalSpend: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
      lastOrderAt: sql<Date>`MAX(${orders.createdAt})`,
      firstOrderAt: sql<Date>`MIN(${orders.createdAt})`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, store.tenantId),
        eq(orders.storeId, store.id),
        isNull(orders.deletedAt)
      )
    )
    .groupBy(orders.customerEmail)
    .orderBy(desc(sql`MAX(${orders.createdAt})`));

  const customers: CustomerRow[] = rowsAgg.map((r) => {
    const last = r.lastOrderAt ? new Date(r.lastOrderAt) : null;
    const first = r.firstOrderAt ? new Date(r.firstOrderAt) : null;

    const status: CustomerRow["status"] =
      first && first >= newThreshold
        ? "New"
        : last && last < churnThreshold
          ? "Churn Risk"
          : "Active";

    return {
      name: r.name || "—",
      email: r.email || "—",
      orders: r.orders,
      totalSpend: Number(r.totalSpend || 0),
      currency,
      lastOrder: (last ?? new Date(0)).toISOString(),
      status,
    };
  });

  const totalCustomers = customers.length;
  const newCount = customers.filter((c) => c.status === "New").length;
  const activeCount = customers.filter((c) => c.status === "Active").length;
  const churnCount = customers.filter((c) => c.status === "Churn Risk").length;

  const statSegments = [
    {
      label: "Total Customers",
      value: totalCustomers.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "New (30 days)",
      value: newCount.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Active",
      value: activeCount.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Churn Risk",
      value: churnCount.toLocaleString(),
      changeLabel: "",
      changeTone: "neutral" as const,
    },
  ];

  return (
    <div className="md:p-6 p-0">
      {/* Mobile View */}
      <div className="block md:hidden">
        <CustomersMobileView
          bootstrap={bootstrap}
          customers={customers}
          statSegments={statSegments}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Key insights and details about your customers.</p>
        </div>

        <SegmentedStatsCard segments={statSegments} />

        <div className="w-full">
          <CustomersTable rows={customers} />
        </div>
      </div>
    </div>
  );
}