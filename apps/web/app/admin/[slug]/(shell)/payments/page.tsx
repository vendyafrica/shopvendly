import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Invoice01Icon, Payment02Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { Badge } from "@shopvendly/ui/components/badge";
import { adminDashboardService } from "@/modules/admin";
import { CollectoPayoutCard } from "@/modules/admin/components/collecto-payout-card";
import { TotalSalesBreakdownCard } from "@/modules/admin/components/dynamic-charts";
import { RecentOrdersTableSection } from "@/modules/admin/components/recent-orders-table-section";
import { getStorefrontUrl } from "@/utils/misc";
import { PaymentsMobileView } from "./components/payments-mobile-view";


function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency, 
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await adminDashboardService.getDashboardData(slug, "monthly");

  if (!data) {
    return (
      <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
        Store not found.
      </div>
    );
  }

  const { store, breakdown, transactionRows, currency } = data;
  const basePath = `/admin/${slug}`;
  const storefrontUrl = getStorefrontUrl(slug);

  const collectoBalanceResponse = await fetch(
    `/api/stores/${encodeURIComponent(store.id)}/collecto/available-balance`,
    { cache: "no-store" }
  ).catch(() => null);

  type CollectoBalanceResponse = {
    walletBalance?: number;
    bulkBalance?: number;
    withdrawable?: number;
    pendingTransfer?: number;
    totalOwedBalance?: number;
    pendingOrderIds?: string[];
  };

  const collectoBalance = collectoBalanceResponse?.ok
    ? (await collectoBalanceResponse.json().catch(() => null)) as CollectoBalanceResponse | null
    : null;

  const walletBalance = collectoBalance?.walletBalance ?? 0;
  const bulkBalance = collectoBalance?.bulkBalance ?? 0;
  const withdrawable = collectoBalance?.withdrawable ?? 0;
  const pendingOrderCount = collectoBalance?.pendingOrderIds?.length ?? 0;

  const quickStats = [
    { label: "Revenue", value: formatCurrency(breakdown.revenue, currency), icon: Invoice01Icon },
    { label: "In Wallet", value: formatCurrency(walletBalance, currency), icon: Payment02Icon, subtitle: pendingOrderCount > 0 ? `${pendingOrderCount} pending transfer` : undefined },
    { label: "In Bulk", value: formatCurrency(bulkBalance, currency), icon: Payment02Icon },
    { label: "Withdrawable", value: formatCurrency(withdrawable, currency), icon: Invoice01Icon },
  ];

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="hidden md:flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Payments
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            A single place to review earnings and wallet balance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`${basePath}/orders`} className="text-xs font-semibold text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            View orders
          </Link>
          <Link href={storefrontUrl} className="text-xs font-semibold text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            Open storefront
          </Link>
        </div>
      </div>

      <div className="md:hidden">
        <PaymentsMobileView
          bootstrap={{
            tenantId: store.tenantId,
            storeId: store.id,
            storeSlug: slug,
            storeName: store.name,
            storeLogoUrl: store.logoUrl || undefined,
            defaultCurrency: currency,
          }}
          revenue={breakdown.revenue}
          walletBalance={walletBalance}
          bulkBalance={bulkBalance}
          withdrawable={withdrawable}
          currency={currency}
          transactions={transactionRows}
        />
      </div>

      <div className="hidden w-full md:block">
        <CollectoPayoutCard />

        <div className="grid gap-4 md:grid-cols-4 mt-4">
          {quickStats.map((item) => (
            <Card key={item.label} className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</CardTitle>
                <HugeiconsIcon icon={item.icon} className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold leading-none">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mt-6">
          <div className="lg:col-span-2">
            <TotalSalesBreakdownCard breakdown={breakdown} />
          </div>

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">Payments notes</CardTitle>
              <CardDescription>What these numbers mean</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Revenue</p>
                <p>Total customer-paid amount on paid orders (before Collecto 3% fee).</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">In Wallet</p>
                <p>Funds collected but not yet transferred to Bulk. These need a wallet→bulk transfer before payout.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">In Bulk</p>
                <p>Funds already transferred to Collecto Bulk and ready for seller payout.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Withdrawable</p>
                <p>Amount that can be withdrawn from Bulk after subtracting the 1,200 UGX transfer fee.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <RecentOrdersTableSection rows={transactionRows} viewAllHref={`${basePath}/orders`} />
        </div>
      </div>
    </div>
  );
}
