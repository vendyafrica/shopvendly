import Link from "next/link";
import { type ReactNode } from "react";
import { RevenueAreaChartCard, TopProductsBarChartCard } from "@/modules/admin/components/dynamic-charts";
import { RecentTransactionsTable } from "@/modules/admin/components/recent-transactions-table";
import { QuickActionMobile } from "@/modules/admin/components/quick-action-mobile";
import { ShareLinkSection } from "@/modules/admin/components/share-link-section";
import { SimpleLineChartCard } from "@/modules/admin/components/simple-line-chart-card";
import { QuickActionsGrid } from "@/modules/admin/components/quick-actions-grid";
import { adminDashboardService } from "@/modules/admin";
import { getStorefrontUrl } from "@/utils/misc";
import {
  Add01Icon,
  ShoppingBag01Icon,
  Invoice01Icon,
  Share01Icon,
  Link01Icon,
  UserGroupIcon,
  ViewIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@shopvendly/ui/components/badge";
import { cn } from "@shopvendly/ui/lib/utils";

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

  const { store, stats, revenueSeries, ordersSeries, topProducts, transactionRows, currency } = data;
  const [sRevenue, sOrders, sCustomers, sVisits ] = stats;
  const basePath = `/admin/${slug}`;
  const storefrontUrl = getStorefrontUrl(slug);

  const conversionRate = data.traffic.visits > 0 ? ((sOrders?.value || 0) / data.traffic.visits) * 100 : null;
  const conversionRateLabel = conversionRate === null ? "—" : `${conversionRate.toFixed(1)}%`;

  const quickActions = [
    { label: "New Product", href: `${basePath}/products/new`, icon: Add01Icon, color: "text-blue-500" },
    { label: "Orders", href: `${basePath}/transactions`, icon: Invoice01Icon, color: "text-emerald-500" },
    { label: "Products", href: `${basePath}/products`, icon: ShoppingBag01Icon, color: "text-amber-500" },
    { label: "Settings", href: `${basePath}/settings`, icon: Settings02Icon, color: "text-purple-500" },
    { label: "Storefront", href: storefrontUrl, icon: Share01Icon, external: true, color: "text-indigo-500" },
  ];

  const activityItems = transactionRows.slice(0, 6).map((tx: any) => ({
    ...tx,
    title: tx.customer || "New customer",
    subtitle: tx.product,
    time: tx.date,
  }));

  return (
    <div className="space-y-6">
      <div className="flex md:hidden flex-col gap-6">
        {/* Header with Store URL */}
        <div className="flex items-center justify-between px-1">
          <Badge variant="outline" className="text-[10px] px-3 py-1 border-primary/20 text-primary font-bold uppercase tracking-widest bg-primary/5 rounded-full">{store.name}</Badge>
          <div className="flex items-center capitalize justify-center text-muted-foreground font-medium text-[10px] max-w-[220px] break-words text-right leading-tight">
            {store.description || slug}
          </div>
        </div>

        {/* Share Link Section */}
        <ShareLinkSection url={storefrontUrl} />

        {/* Quick Stats redesigned */}
        <div className="px-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Store Overview</h2>
            <Link href={`${basePath}/analytics`} className="text-[11px] font-semibold text-primary">View Insights</Link>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Main Stat: Revenue */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-emerald-500">
                <HugeiconsIcon icon={Invoice01Icon} size={64} />
              </div>
              <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Total Revenue</span>
                  {sRevenue?.changeLabel && (
                    <span className={cn(
                       "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      sRevenue.changeTone === "positive" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                    )}>
                      <HugeiconsIcon icon={sRevenue.changeTone === "positive" ? ArrowUp01Icon : ArrowDown01Icon} size={10} className="mr-0.5" />
                      {sRevenue.changeLabel}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold tracking-tight">
                  {formatStatCurrency((sRevenue?.value || 0) as number, currency)}
                </p>
              </div>
            </div>

            {/* Sub Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Orders", value: sOrders?.value || 0, icon: ShoppingBag01Icon, color: "text-primary", change: sOrders?.changeLabel, tone: sOrders?.changeTone },
                { label: "Customers", value: sCustomers?.value || 0, icon: UserGroupIcon, color: "text-primary", change: sCustomers?.changeLabel, tone: sCustomers?.changeTone },
                { label: "Visits", value: sVisits?.value || 0, icon: ViewIcon, color: "text-primary" },
                { label: "Conversion", value: conversionRateLabel, icon: ViewIcon, color: "text-primary" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border bg-card p-4 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className={cn("flex items-center justify-center", s.color)}>
                      <HugeiconsIcon icon={s.icon} size={18} />
                    </div>
                    {s.change && (
                      <span className={cn(
                        "text-[9px] font-bold",
                        s.tone === "positive" ? "text-emerald-600" : "text-red-600"
                      )}>
                        {s.change}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{s.label}</p>
                    <p className="text-lg font-bold tracking-tight">{s.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions horizontal scroll */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold tracking-tight">Quick Actions</h2>
          </div>
          <div className="flex items-center justify-between px-1">
            {quickActions.map((action) => (
              <QuickActionMobile
                key={action.label}
                label={action.label}
                href={action.href}
                icon={action.icon}
                external={action.external}
                iconClassName={action.color}
              />
            ))}
          </div>
        </div>

        {/* Recent Transactions refined */}
        <div className="space-y-4 px-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold tracking-tight">Recent Activity</p>
            <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse border-emerald-500/30 text-emerald-600 bg-emerald-500/5">Live</Badge>
          </div>
          {activityItems.length === 0 ? (
            <div className="rounded-2xl border bg-card/50 px-4 py-12 text-center">
              <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                <HugeiconsIcon icon={Invoice01Icon} className="text-muted-foreground/40" size={24} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityItems.map((item: any) => (
                <div key={item.id} className="rounded-2xl border bg-card p-4 shadow-sm flex items-center gap-4 group active:bg-muted/30 transition-colors">
                  <div className={cn(
                    "flex items-center justify-center",
                    item.status === "Completed" ? "text-emerald-500" : 
                    item.status === "Failed" ? "text-red-500" : 
                    "text-primary"
                  )}>
                    <HugeiconsIcon icon={Invoice01Icon} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate leading-none mb-1">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate leading-none mb-1">{item.subtitle}</p>
                    <p className="text-[10px] font-medium text-muted-foreground/60">{item.time}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold mb-1 tracking-tight">{item.amount}</p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9px] font-bold uppercase px-2 py-0 rounded-full border-none",
                        item.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" : 
                        item.status === "Pending" ? "bg-amber-500/10 text-amber-600" : 
                        "bg-red-500/10 text-red-600"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link 
            href={`${basePath}/transactions`}
            className="flex w-full items-center justify-center py-3 text-xs font-bold text-muted-foreground hover:text-primary transition-colors border rounded-2xl border-dashed hover:border-primary/30"
          >
            See all transactions
          </Link>
        </div>
      </div>

      <div className="hidden md:flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground border bg-muted/20 px-4 py-2 rounded-full shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">Store Link</span>
              <span className="text-[11px] font-semibold text-foreground/70 select-all">{storefrontUrl.replace(/^https?:\/\//, "")}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
          <div className="md:col-span-12 lg:col-span-4 lg:order-2">
             <QuickActionsGrid basePath={basePath} storefrontUrl={storefrontUrl} />
          </div>
          <div className="md:col-span-12 lg:col-span-8 lg:order-1 grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
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
            totalLabel={topProducts.reduce((acc: number, p: any) => acc + p.sales, 0).toLocaleString()}
            data={topProducts}
          />
        </div>

        <RecentTransactionsTable rows={transactionRows} />
      </div>
    </div>
  );
}
