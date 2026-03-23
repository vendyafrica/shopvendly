import Link from "next/link";
import { type ReactNode } from "react";
import { RevenueAreaChartCard, TotalSalesBreakdownCard } from "@/modules/admin/components/dynamic-charts";
import { RecentOrdersTableSection } from "@/modules/admin/components/recent-orders-table-section";
import { QuickActionMobile } from "@/modules/admin/components/quick-action-mobile";
import { MobileStoreHeader } from "@/modules/admin/components/mobile-store-header";
import { DashboardFilter } from "@/modules/admin/components/dashboard-filter";
import { CollectoPayoutButton } from "@/modules/admin/components/collecto-payout-button";
import { CollectoPayoutCard } from "@/modules/admin/components/collecto-payout-card";
import { adminDashboardService, type DashboardRange } from "@/modules/admin";
import { type OrderSummaryRow } from "@/modules/admin/models";
import { getStorefrontUrl } from "@/utils/misc";
import {
  Add01Icon,
  ShoppingBag01Icon,
  Invoice01Icon,
  Share01Icon,
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

type ActivityItem = OrderSummaryRow & {
  title: string;
  subtitle?: string;
  time: string;
};

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { range } = (await searchParams) as { range: DashboardRange };
  const data = await adminDashboardService.getDashboardData(slug, range || "monthly");

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          Store not found.
        </div>
      </div>
    );
  }

  const { store, stats, revenueSeries, breakdown, transactionRows, currency } = data;
  const basePath = `/admin/${slug}`;
  const storefrontUrl = getStorefrontUrl(slug);

  const quickActions = [
    { label: "New Product", href: `${basePath}/products/new`, icon: Add01Icon, color: "text-blue-500" },
    { label: "Orders", href: `${basePath}/orders`, icon: Invoice01Icon, color: "text-emerald-500" },
    { label: "Products", href: `${basePath}/products`, icon: ShoppingBag01Icon, color: "text-amber-500" },
    { label: "Settings", href: `${basePath}/settings`, icon: Settings02Icon, color: "text-purple-500" },
    { label: "Storefront", href: storefrontUrl, icon: Share01Icon, external: true, color: "text-indigo-500" },
  ];

  const activityItems: ActivityItem[] = transactionRows.slice(0, 6).map((tx: OrderSummaryRow) => ({
    ...tx,
    title: tx.customer || "New customer",
    subtitle: tx.product,
    time: tx.date,
  }));

  return (
    <div className="space-y-6">
      {/* Mobile View */}
      <div className="flex md:hidden flex-col gap-6">
        <MobileStoreHeader
          storeName={store.name}
          storeDescription={store.description}
          storefrontUrl={storefrontUrl}
          logoUrl={store.logoUrl}
          heroMedia={Array.isArray(store.heroMedia) ? store.heroMedia : []}
        />

        <div className="px-1 space-y-4" data-tour-step-id="admin-overview">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Store Overview</h2>
            <DashboardFilter />
          </div>
          <CollectoPayoutCard />

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col divide-y">
            <div className="p-5 flex flex-col gap-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-emerald-500">
                <HugeiconsIcon icon={Invoice01Icon} size={64} />
              </div>
              <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{stats[0]?.label}</span>
                  {stats[0]?.changeLabel && (
                    <span className={cn(
                      "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                      stats[0]?.changeTone === "positive" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                    )}>
                      <HugeiconsIcon icon={stats[0]?.changeTone === "positive" ? ArrowUp01Icon : ArrowDown01Icon} size={10} className="mr-0.5" />
                      {stats[0]?.changeLabel}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold tracking-tight">
                  {formatStatCurrency((stats[0]?.value ?? 0) as number, currency)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x">
              {stats.slice(1).map((s, idx) => (
                <div key={s.label} className={cn("p-4 flex flex-col gap-1", idx > 1 && "border-t")}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{s.label}</span>
                    {s.changeLabel && (
                      <span className={cn(
                        "text-[9px] font-bold",
                        s.changeTone === "positive" ? "text-emerald-600" : s.changeTone === "negative" ? "text-red-600" : "text-muted-foreground"
                      )}>
                        {s.changeLabel}
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold tracking-tight">
                    {s.isNumeric ? s.value : formatStatCurrency(s.value as number, currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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

        <div className="space-y-4 px-1" data-tour-step-id="recent-activity">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold tracking-tight">Recent Activity</p>
            <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse border-emerald-500/30 text-emerald-600 bg-emerald-500/5">Live</Badge>
          </div>
          <div className="space-y-3">
            {activityItems.map((item) => (
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
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-bold uppercase px-2 py-0 rounded-full border-none",
                    item.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" :
                      item.status === "Pending" ? "bg-amber-500/10 text-amber-600" :
                        "bg-red-500/10 text-red-600"
                  )}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <Link href={`${basePath}/orders`} data-tour-step-id="orders-table" className="flex w-full items-center justify-center py-3 text-xs font-bold text-muted-foreground hover:text-primary transition-colors border rounded-2xl border-dashed hover:border-primary/30">
            See all orders
          </Link>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">Overview</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground border bg-muted/20 px-4 py-2 rounded-md shadow-sm w-fit">
              <span className="text-[11px] font-bold text-muted-foreground/90">Store Link :</span>
              <span className="text-[11px] font-semibold text-foreground/70 select-all">{storefrontUrl.replace(/^https?:\/\//, "")}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CollectoPayoutButton />
            <DashboardFilter />
          </div>
        </div>

        <CollectoPayoutCard />

        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex divide-x" data-tour-step-id="admin-overview">
          {stats.map((s) => (
            <div key={s.label} className="flex-1 p-8 flex flex-col justify-between group transition-colors hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/90">{s.label}</p>
                {s.changeLabel && (
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                    s.changeTone === "positive" ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                      s.changeTone === "negative" ? "text-red-600 bg-red-50 border-red-100" :
                        "text-muted-foreground bg-muted border-muted-foreground/10"
                  )}>
                    {s.changeLabel}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-medium">
                  {s.isNumeric ? s.value : formatStatCurrency(s.value as number, currency)}
                </h3>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 flex flex-col gap-8">
            <RevenueAreaChartCard
              title="Total sales over time"
              totalLabel={formatCurrency((stats[0]?.value ?? 0) as number, currency)}
              data={revenueSeries}
            />
          </div>

          <div className="col-span-4 flex flex-col gap-8">
            <TotalSalesBreakdownCard
              breakdown={breakdown}
            />
          </div>
        </div>

        <div data-tour-step-id="recent-activity">
          <RecentOrdersTableSection rows={transactionRows} viewAllHref={`${basePath}/orders`} />
        </div>
      </div>
    </div>
  );
}
