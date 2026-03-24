"use client";

import * as React from "react";
import { StoreAvatar } from "@/components/store-avatar";
import { type OrderSummaryRow } from "@/modules/admin/models";
import { HugeiconsIcon } from "@hugeicons/react";
import { Invoice01Icon, Payment02Icon, PackageOpenIcon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { CollectoPayoutCard } from "@/modules/admin/components/collecto-payout-card";
import { useRouter } from "next/navigation";
import { cn } from "@shopvendly/ui/lib/utils";

interface PaymentsMobileViewProps {
    storeName: string;
    storeLogoUrl?: string | null;
    storeSlug: string;
    revenue: number;
    walletBalance: number;
    bulkBalance: number;
    withdrawable: number;
    currency: string;
    transactions: OrderSummaryRow[];
}

const STATUS_COLORS = {
    Completed: "text-emerald-500 bg-emerald-50 border-emerald-200",
    Pending: "text-amber-500 bg-amber-50 border-amber-200",
    Failed: "text-rose-500 bg-rose-50 border-rose-200",
};

export function PaymentsMobileView({
    storeName,
    storeLogoUrl,
    storeSlug,
    revenue,
    walletBalance,
    bulkBalance,
    withdrawable,
    currency,
    transactions,
}: PaymentsMobileViewProps) {
    const router = useRouter();

    const adminHref = storeSlug ? `/admin/${storeSlug}` : "/admin";

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleOrderClick = (tx: OrderSummaryRow) => {
        const id = (tx as any).actualId;
        if (id && storeSlug) {
            router.push(`/admin/${storeSlug}/orders/${id}`);
        }
    };

    return (
        <div className="flex flex-col pb-20 w-full max-w-full overflow-hidden sm:hidden -mx-4 w-[calc(100%+2rem)]">
            {/* Header Profile Section */}
            <div className="px-5 py-6">
                <div className="flex items-center gap-6 mb-5">
                    <StoreAvatar
                        storeName={storeName}
                        logoUrl={storeLogoUrl}
                        size="lg"
                        shape="square"
                        className="size-[84px] shrink-0 border border-border rounded-[32px] bg-white p-1"
                    />

                    <div className="flex-1 flex justify-between items-center text-center">
                        <div className="flex flex-col items-center flex-1">
                            <span className="font-semibold text-base tracking-tight">{formatCurrency(revenue)}</span>
                            <span className="text-[10px] font-medium text-foreground tracking-wide uppercase mt-0.5 whitespace-nowrap">Revenue</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                            <span className="font-semibold text-base tracking-tight">{formatCurrency(withdrawable)}</span>
                            <span className="text-[10px] font-medium text-foreground tracking-wide uppercase mt-0.5 whitespace-nowrap">Withdrawable</span>
                        </div>
                    </div>
                </div>

                <div className="mb-5 px-0.5">
                    <h2 className="font-bold text-sm tracking-tight">{storeName}</h2>
                    <p className="text-[13px] text-foreground/80 mt-1 leading-snug whitespace-pre-line text-balance">
                        Manage your earnings and payouts in real-time.
                    </p>
                </div>

                <div className="flex gap-2 w-full mb-6">
                    <Button
                        className="flex-1 rounded-md font-semibold text-xs h-10"
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`${adminHref}/orders`)}
                    >
                        View Orders
                    </Button>
                    <Button
                        className="flex-1 rounded-md font-semibold text-xs h-10"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(adminHref)}
                    >
                        Dashboard
                    </Button>
                </div>

                {/* Payout Card Section */}
                <div className="px-0">
                    <CollectoPayoutCard />
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="px-5 grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">In Wallet</span>
                        <HugeiconsIcon icon={Payment02Icon} className="size-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold">{formatCurrency(walletBalance)}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">In Bulk</span>
                        <HugeiconsIcon icon={Payment02Icon} className="size-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold">{formatCurrency(bulkBalance)}</p>
                </div>
            </div>

            {/* Recent Transactions List */}
            <div className="px-4 pt-2">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Recent payments</h3>
                    <span className="text-xs text-muted-foreground">Tap row for details</span>
                </div>
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-60">
                        <div className="size-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-4">
                            <HugeiconsIcon icon={PackageOpenIcon} className="size-8 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-foreground">No Payments Yet</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/60">
                        <div className="grid grid-cols-[1.4fr_1fr_0.8fr] items-center border-b bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <span>Customer</span>
                            <span className="text-right">Amount</span>
                            <span className="text-right">Status</span>
                        </div>
                        <div className="divide-y">
                            {transactions.map((tx) => {
                                const colors = STATUS_COLORS[tx.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Pending;
                                return (
                                    <button
                                        key={tx.id}
                                        onClick={() => handleOrderClick(tx)}
                                        className="grid w-full grid-cols-[1.4fr_1fr_0.8fr] items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/50"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">{tx.customer || "Guest"}</p>
                                            <p className="truncate text-[11px] text-muted-foreground">{tx.date}</p>
                                        </div>
                                        <p className="text-right text-sm font-semibold">{tx.amount}</p>
                                        <div className="flex justify-end">
                                            <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase", colors)}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
