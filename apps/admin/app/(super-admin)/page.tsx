"use client";

import { useEffect, useState } from "react";
import { SegmentedStatsCard } from "../../features/super-admin/components/segmented-stats-card";
import { RevenueAreaChartCard } from "../../features/super-admin/components/revenue-area-chart-card";
import { TopProductsBarChartCard } from "../../features/super-admin/components/top-products-bar-chart-card";
import { TopStoresCard } from "../../features/super-admin/components/top-stores-card";
import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { Skeleton } from "@shopvendly/ui/components/skeleton";

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

export default function AdminPage() {
  const [data, setData] = useState<adminApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  console.log("data", data);

  useEffect(() => {
    fetch("/api/dashboard")
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
        {/* Stats Header */}
        <div>
          <Skeleton className="h-8 w-[180px] mb-2" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} size="sm" className="bg-muted/20 border-border/40 shadow-none">
              <CardContent className="pt-4 flex flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="md:col-span-4 border-border/70 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-[150px] mb-4" />
              <Skeleton className="h-[260px] md:h-[320px] w-full" />
            </CardContent>
          </Card>
          <Card className="md:col-span-3 border-border/70 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-[120px] mb-4" />
              <Skeleton className="h-[260px] md:h-[320px] w-full" />
            </CardContent>
          </Card>
        </div>
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
        <p className="text-sm text-muted-foreground">
          Platform overview and key metrics
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
          <CardContent className="pt-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Total Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">{formatCurrency(marketplace.gmv)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground/60">Lifetime GMV</span>
          </CardContent>
        </Card>

        <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
          <CardContent className="pt-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Total Stores</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">{stores.total.toString()}</span>
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{stores.active} active</span>
            </div>
            <span className="text-[10px] text-muted-foreground/60">Platform worldwide</span>
          </CardContent>
        </Card>

        <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
          <CardContent className="pt-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Tenants</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">{tenants.total.toString()}</span>
              {tenants.new30d > 0 && <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">+{tenants.new30d}</span>}
            </div>
            <span className="text-[10px] text-muted-foreground/60">Last 30 days growth</span>
          </CardContent>
        </Card>

        <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
          <CardContent className="pt-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Total Orders</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">{marketplace.totalOrders.toString()}</span>
            </div>
            <span className="text-[10px] text-muted-foreground/60">Across all stores</span>
          </CardContent>
        </Card>
      </div>

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
