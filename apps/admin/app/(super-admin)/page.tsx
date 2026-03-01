"use client";

import { useEffect, useState } from "react";
import { SegmentedStatsCard } from "../../features/super-admin/components/segmented-stats-card";
import { RevenueAreaChartCard } from "../../features/super-admin/components/revenue-area-chart-card";
import { TopProductsBarChartCard } from "../../features/super-admin/components/top-products-bar-chart-card";
import { TopStoresCard } from "../../features/super-admin/components/top-stores-card";
import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";

type RevenueSeriesPoint = { date: string; total: number };
type TopStoresByOrdersRow = { storeId: string | null; storeName: string | null; orders: number };
type adminApiResponse = {
  tenants: { total: number; new7d: number; new30d: number };
  stores: { total: number; active: number; inactive: number };
  marketplace: { gmv: number; totalOrders: number };
  revenueSeries?: RevenueSeriesPoint[];
  topStoresByOrders?: TopStoresByOrdersRow[];
  topStores: {
    byRevenue: Array<{ storeId: string; storeName: string | null; revenue: number | null }>;
    byVisits: Array<{ storeId: string; storeName: string | null; visits: number | null }>;
  };
};

const ADMIN_CURRENCY = process.env.NEXT_PUBLIC_ADMIN_CURRENCY || "UGX";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: ADMIN_CURRENCY,
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function adminPage() {
  const [data, setData] = useState<adminApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  console.log("data", data);
  ///hey....

  useEffect(() => {
    fetch("/api/admin")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="text-sm text-muted-foreground">Loading admin...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="text-sm text-destructive">Failed to load admin data.</div>
      </div>
    );
  }

  const { tenants, stores, marketplace, topStores } = data;

  const revenueSeries = Array.isArray(data?.revenueSeries) ? data.revenueSeries : [];
  const hasRevenueSeries = revenueSeries.some((p) => Number(p?.total) > 0);

  const topStoresByOrdersRaw = Array.isArray(data?.topStoresByOrders) ? data.topStoresByOrders : [];
  const topStoresByOrders = topStoresByOrdersRaw
    .filter((row) => row?.storeName)
    .map((row) => ({
      product: String(row.storeName),
      sales: Number(row.orders ?? 0),
      fill: "hsl(var(--primary))",
    }))
    .filter((row) => row.sales > 0);

  const hasTopStoresByOrders = topStoresByOrders.length > 0;

  const topStoresByRevenue = (topStores?.byRevenue ?? []).map((s) => ({
    storeId: s.storeId,
    storeName: s.storeName ?? "—",
    revenue: Number(s.revenue ?? 0),
  }));

  const topStoresByVisits = (topStores?.byVisits ?? []).map((s) => ({
    storeId: s.storeId,
    storeName: s.storeName ?? "—",
    visits: Number(s.visits ?? 0),
  }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">admin</h1>
        <p className="text-sm text-muted-foreground">
          Platform overview and key metrics
        </p>
      </div>

      {/* KPI Stats */}
      <SegmentedStatsCard
        segments={[
          {
            label: "Total Revenue",
            value: formatCurrency(marketplace.gmv),
            changeLabel: "Lifetime GMV",
            changeTone: "neutral",
          },
          {
            label: "Total Stores",
            value: stores.total.toString(),
            changeLabel: `${stores.active} active`,
            changeTone: "positive",
          },
          {
            label: "Tenants",
            value: tenants.total.toString(),
            changeLabel: `+${tenants.new30d} last 30 days`,
            changeTone: "positive",
          },
          {
            label: "Total Orders",
            value: marketplace.totalOrders.toString(),
            changeLabel: "Across all stores",
            changeTone: "neutral",
          },
        ]}
      />

      {/* Charts Section */}
      <div className="grid gap-5 md:grid-cols-7 lg:grid-cols-7">
        {hasRevenueSeries ? (
          <RevenueAreaChartCard
            className="md:col-span-4"
            title="Platform Revenue"
            totalLabel={formatCurrency(marketplace.gmv)}
            data={revenueSeries}
          />
        ) : (
          <Card className="w-full border-border/70 shadow-sm md:col-span-4">
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-base">Platform Revenue</CardTitle>
              <div className="text-3xl font-bold text-foreground">{formatCurrency(marketplace.gmv)}</div>
            </CardHeader>
            <CardContent className="px-3 pb-4 md:px-5">
              <div className="flex h-[260px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground md:h-[320px]">
                No data yet
              </div>
            </CardContent>
          </Card>
        )}

        {hasTopStoresByOrders ? (
          <TopProductsBarChartCard
            className="md:col-span-3"
            title="Top Stores"
            description="By order volume"
            totalLabel={topStoresByOrders.reduce((acc, p) => acc + p.sales, 0).toLocaleString()}
            data={topStoresByOrders}
          />
        ) : (
          <Card className="w-full border-border/70 shadow-sm md:col-span-3">
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-base">Top Stores</CardTitle>
              <div className="text-3xl font-bold text-foreground">0</div>
            </CardHeader>
            <CardContent className="px-3 pb-4 md:px-5">
              <div className="flex h-[260px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground md:h-[320px]">
                No data yet
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Stores Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        <TopStoresCard
          title="Top Stores by Revenue"
          description="Stores generating the most paid revenue"
          stores={topStoresByRevenue}
          dataKey="revenue"
          formatValue={(store) => formatCurrency(Number(store.revenue ?? 0))}
        />
        <TopStoresCard
          title="Top Stores by Traffic"
          description="Most visited stores (sessions)"
          stores={topStoresByVisits}
          dataKey="visits"
          formatValue={(store) => `${Number(store.visits ?? 0).toLocaleString()} visits`}
        />
      </div>
    </div>
  );
}
