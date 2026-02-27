"use client";

import * as React from "react";
import { useTenant } from "../tenant-context";
import { segmented-stats-card } from "../components/segmented-stats-card";
import { revenue-area-chart-card, visits-area-chart-card, type RevenuePoint, type VisitsPoint } from "../components/dynamic-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";

type OverviewResponse = {
  range: { from: string; to: string };
  currency: string;
  kpis: {
    revenuePaid: number;
    ordersPaid: number;
    aov: number;
    refunds: number;
  };
  timeseries: Array<{ date: string; revenuePaid: number; ordersPaid: number }>;
  traffic: {
    visits: number;
    uniqueVisitors: number;
    returningVisitors: number;
    timeseries: Array<{ date: string; visits: number; uniqueVisitors: number }>;
  };
  topViewed: Array<{ productId: string | null; productName: string | null; count: number }>;
  topAddToCart: Array<{ productId: string | null; productName: string | null; count: number }>;
};

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

      const json = (await res.json()) as OverviewResponse;
      setData(json);
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

  const currency = data?.currency || bootstrap?.defaultCurrency || "UGX ";

  const kpiSegments = [
    {
      label: "Revenue (Paid)",
      value: data ? formatCurrency(data.kpis.revenuePaid, currency) : "—",
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Paid Orders",
      value: data ? data.kpis.ordersPaid.toLocaleString() : "—",
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Unique Visitors",
      value: data ? data.traffic.uniqueVisitors.toLocaleString() : "—",
      changeLabel: "",
      changeTone: "neutral" as const,
    },
    {
      label: "Returning",
      value: data ? data.traffic.returningVisitors.toLocaleString() : "—",
      changeLabel: "",
      changeTone: "neutral" as const,
    },
  ];

  const revenueData: RevenuePoint[] = (data?.timeseries || []).map((p) => ({
    date: p.date,
    total: p.revenuePaid,
  }));

  const visitsData: VisitsPoint[] = (data?.traffic.timeseries || []).map((p) => ({
    date: p.date,
    visits: p.visits,
  }));

  const revenueTotalLabel = data ? formatCurrency(data.kpis.revenuePaid, currency) : "—";
  const visitsTotalLabel = data ? data.traffic.visits.toLocaleString() : "—";

  return (
    <div className="space-y-6">
      {bootstrapError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <div className="text-sm">{bootstrapError}</div>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <div className="text-sm">{error}</div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Sales and traffic insights for your storefront.
        </p>
      </div>

      <segmented-stats-card segments={kpiSegments} />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <revenue-area-chart-card title="Revenue (Paid)" totalLabel={revenueTotalLabel} data={revenueData} />
        <visits-area-chart-card title="Visits" totalLabel={visitsTotalLabel} data={visitsData} />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Viewed Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.topViewed || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No data yet.</div>
              ) : (
                (data?.topViewed || []).map((row) => (
                  <div key={row.productId ?? row.productName ?? "unknown"} className="flex items-center justify-between">
                    <div className="text-sm font-medium">{row.productName || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">{row.count.toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Add To Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.topAddToCart || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No data yet.</div>
              ) : (
                (data?.topAddToCart || []).map((row) => (
                  <div key={row.productId ?? row.productName ?? "unknown"} className="flex items-center justify-between">
                    <div className="text-sm font-medium">{row.productName || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">{row.count.toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
    </div>
  );
}