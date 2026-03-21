import Link from "next/link";
import { type ReactNode } from "react";


import { RevenueAreaChartCard, TopProductsBarChartCard } from "@/app/admin/components/dynamic-charts";
import { RecentTransactionsTable } from "@/app/admin/components/recent-transactions-table";
import { QuickAddLauncher } from "@/app/admin/components/quick-add-launcher";
import { SimpleLineChartCard } from "@/app/admin/components/simple-line-chart-card";
import { QuickActionsGrid } from "@/app/admin/components/quick-actions-grid";
import { adminDashboardService } from "@/modules/admin";
import { getStorefrontUrl } from "@/utils/misc";
import {
  Add01Icon,
  ShoppingBag01Icon,
  Invoice01Icon,
  Share01Icon,
  Link01Icon,
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

export default async function AdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await adminDashboardService.getDashboardData(slug);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          Store not found.
        </div>
      </div>
    );
  }

  const { stats, revenueSeries, ordersSeries, topProducts, transactionRows, currency } = data;
  const [sRevenue, sOrders ] = stats;
  const basePath = `/admin/${slug}`;
  const storefrontUrl = getStorefrontUrl(slug);

  const statSegments = stats.map(s => ({
    ...s,
    value: typeof s.value === 'number' && (s.label.includes('Revenue') || s.label.includes('AOV')) 
      ? formatStatCurrency(s.value, currency)
      : s.value.toLocaleString()
  }));

  const conversionRate = data.traffic.visits > 0 ? ((sOrders?.value || 0) / data.traffic.visits) * 100 : null;
  const conversionRateLabel = conversionRate === null ? "—" : `${conversionRate.toFixed(1)}%`;

  // Add conversion rate to stats if needed, or handle it in the service
  statSegments.push({
    label: "Conversion Rate",
    value: conversionRateLabel,
    changeLabel: "",
    changeTone: "neutral" as const,
  });

  const quickActions = [
    { label: "Add product", href: `${basePath}/products?quickAdd=1`, icon: Add01Icon },
    { label: "Orders", href: `${basePath}/transactions`, icon: Invoice01Icon },
    { label: "Products", href: `${basePath}/products`, icon: ShoppingBag01Icon },
    { label: "Share store", href: storefrontUrl, icon: Share01Icon, external: true },
  ];

  const activityItems = transactionRows.slice(0, 6).map((tx: { id: string; customer: string; product: string; amount: string; status: string; date: string }) => ({
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
              value={formatCurrency(sRevenue?.value || 0, currency)}
              data={revenueSeries}
              trend={sRevenue?.changeLabel || ""}
              trendTone={sRevenue?.changeTone || "neutral"}
            />
            <SimpleLineChartCard
              title="Paid Orders"
              value={(sOrders?.value || 0).toLocaleString()}
              data={ordersSeries}
              trend={sOrders?.changeLabel || ""}
              trendTone={sOrders?.changeTone || "neutral"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
          <RevenueAreaChartCard
            className="md:col-span-8 lg:col-span-8"
            title="Revenue Performance"
            totalLabel={formatCurrency(sRevenue?.value || 0, currency)}
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
