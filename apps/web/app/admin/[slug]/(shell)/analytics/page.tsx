"use client";

import * as React from "react";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { RevenueAreaChartCard, VisitsAreaChartCard, type RevenuePoint, type VisitsPoint } from "@/modules/admin/components/dynamic-charts";
import { type OverviewResponse } from "@/modules/admin/models";
import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download01Icon,
  MoreHorizontalIcon,
  AlertCircleIcon,
  FilterIcon
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AnalyticsPage() {
  const { bootstrap, error: bootstrapError } = useTenant();
  const [data, setData] = React.useState<OverviewResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchOverview = React.useCallback(async () => {
    if (!bootstrap?.storeSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const to = new Date();
      const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

      const res = await fetch(
        `/api/admin/analytics/overview?storeSlug=${encodeURIComponent(bootstrap.storeSlug)}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to fetch analytics (${res.status})`);
      }

      const envelope = await res.json();
      setData((envelope.data ?? envelope) as OverviewResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [bootstrap?.storeSlug]);

  React.useEffect(() => {
    if (bootstrap?.storeSlug) {
      void fetchOverview();
    }
  }, [bootstrap?.storeSlug, fetchOverview]);

  const currency = data?.currency || bootstrap?.defaultCurrency || "UGX";

  // KPI mapping for the grid
  const kpis = [
    {
      label: "Revenue (Paid)",
      value: data ? formatCurrency(data.kpis.revenuePaid, currency) : "—",
    },
    {
      label: "Paid Orders",
      value: data ? data.kpis.ordersPaid.toLocaleString() : "—",
    },
    {
      label: "Unique Visitors",
      value: data ? data.traffic.uniqueVisitors.toLocaleString() : "—",
    },
    {
      label: "Returning",
      value: data ? data.traffic.returningVisitors.toLocaleString() : "—",
    },
  ];

  // Fill missing dates
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const revenueSeriesMap = new Map((data?.timeseries || []).map((p) => [p.date, p.revenuePaid]));
  const visitsSeriesMap = new Map((data?.traffic.timeseries || []).map((p) => [p.date, p.visits]));

  const revenueData: RevenuePoint[] = Array.from({ length: 31 }).map((_, i) => {
    const day = new Date(from.getTime());
    day.setDate(from.getDate() + i);
    const isoDate = day.toISOString().slice(0, 10);
    return {
      date: isoDate,
      total: revenueSeriesMap.get(isoDate) ?? 0,
    };
  });

  const visitsData: VisitsPoint[] = Array.from({ length: 31 }).map((_, i) => {
    const day = new Date(from.getTime());
    day.setDate(from.getDate() + i);
    const isoDate = day.toISOString().slice(0, 10);
    return {
      date: isoDate,
      visits: visitsSeriesMap.get(isoDate) ?? 0,
    };
  });

  const revenueTotalLabel = data ? formatCurrency(data.kpis.revenuePaid, currency) : "—";
  const visitsTotalLabel = data ? data.traffic.visits.toLocaleString() : "—";

  return (
    <div className="flex-1 space-y-4 px-4 py-4 md:px-8 md:py-6">
      <div className="flex flex-col gap-4">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Sales and traffic insights for your storefront.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted/40 rounded-lg p-0.5 border border-border/40">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold hover:bg-background/80 transition-all">
                <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
                Export
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold px-3 group">
                  Last 30 days
                  <HugeiconsIcon icon={MoreHorizontalIcon} className="size-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                <DropdownMenuItem>Last 90 days</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="hidden md:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((stat, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-white px-6 py-4 shadow-sm">
              <span className="text-[11px] font-bold text-muted-foreground uppercase leading-tight tracking-wider">{stat.label}</span>
              <span className="text-xl font-bold leading-none">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-6">
        {(error || bootstrapError) && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/25 flex items-center gap-3">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Error loading analytics</p>
              <p className="text-xs opacity-80">{error || bootstrapError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchOverview()} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden p-1">
                <RevenueAreaChartCard title="Revenue (Paid)" totalLabel={revenueTotalLabel} data={revenueData} />
            </div>
            <div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden p-1">
                <VisitsAreaChartCard title="Visits" totalLabel={visitsTotalLabel} data={visitsData} />
            </div>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 pb-12">
            <Card className="rounded-2xl border border-border/60 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold tracking-tight">Top Viewed Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                    {(data?.topViewed || []).length === 0 ? (
                        <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-xl">No data yet.</div>
                    ) : (
                        (data?.topViewed || []).map((row) => (
                        <div key={row.productId ?? row.productName ?? "unknown"} className="flex items-center justify-between group">
                            <div className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">{row.productName || "Unknown"}</div>
                            <div className="text-sm font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md">{row.count.toLocaleString()}</div>
                        </div>
                        ))
                    )}
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border/60 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold tracking-tight">Top Add To Cart</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                    {(data?.topAddToCart || []).length === 0 ? (
                        <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-xl">No data yet.</div>
                    ) : (
                        (data?.topAddToCart || []).map((row) => (
                        <div key={row.productId ?? row.productName ?? "unknown"} className="flex items-center justify-between group">
                            <div className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">{row.productName || "Unknown"}</div>
                            <div className="text-sm font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md">{row.count.toLocaleString()}</div>
                        </div>
                        ))
                    )}
                    </div>
                </CardContent>
            </Card>
        </div>

        {isLoading && data === null ? (
            <div className="flex items-center justify-center py-12">
                <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        ) : null}
      </div>
    </div>
  );
}