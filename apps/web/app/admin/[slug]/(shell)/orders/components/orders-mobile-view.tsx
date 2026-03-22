"use client";

import * as React from "react";
import { StoreAvatar } from "@/components/store-avatar";
import { type TenantBootstrap } from "@/modules/admin/context";
import { type OrderSummaryRow } from "@/modules/admin/models";
import { HugeiconsIcon } from "@hugeicons/react";
import { PackageOpenIcon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { useRouter } from "next/navigation";
import { cn } from "@shopvendly/ui/lib/utils";

interface OrdersMobileViewProps {
    bootstrap: TenantBootstrap | null;
    orders: OrderSummaryRow[];
}

const STATUS_COLORS = {
    Completed: "text-emerald-500 bg-emerald-50 border-emerald-200",
    Pending: "text-amber-500 bg-amber-50 border-amber-200",
    Failed: "text-rose-500 bg-rose-50 border-rose-200",
};

export function OrdersMobileView({
    bootstrap,
    orders: transactions,
}: OrdersMobileViewProps) {
    const router = useRouter();

    const storeName = bootstrap?.storeName || "My Store";
    const adminHref = bootstrap?.storeSlug ? `/admin/${bootstrap.storeSlug}` : "/admin";
    const completedCount = transactions.filter((tx) => tx.status === "Completed").length;
    const pendingCount = transactions.filter((tx) => tx.status === "Pending").length;
    const transactionCount = transactions.length;

    const handleOrderClick = (tx: OrderSummaryRow) => {
        const id = (tx as any).actualId;
        if (id && bootstrap?.storeSlug) {
            router.push(`/admin/${bootstrap.storeSlug}/orders/${id}`);
        }
    };

    return (
        <div className="flex flex-col pb-20 w-full max-w-full overflow-hidden sm:hidden">
            {/* Header Profile Section */}
            <div className="px-5 py-6">
                <div className="flex items-center gap-6 mb-5">
                    <StoreAvatar
                        storeName={storeName}
                        logoUrl={bootstrap?.storeLogoUrl}
                        size="lg"
                        className="size-[84px] shrink-0 border border-border rounded-[32px]"
                    />

                    <div className="flex-1 flex justify-between items-center text-center">
                        <div className="flex flex-col items-center flex-1">
                            <span className="font-semibold text-xl tracking-tight">{transactionCount}</span>
                            <span className="text-[11px] font-medium text-foreground tracking-wide uppercase mt-0.5">Orders</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                            <span className="font-semibold text-xl tracking-tight">{completedCount}</span>
                            <span className="text-[11px] font-medium text-foreground tracking-wide uppercase mt-0.5">Paid</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                            <span className="font-semibold text-xl tracking-tight">{pendingCount}</span>
                            <span className="text-[11px] font-medium text-foreground tracking-wide uppercase mt-0.5">Pending</span>
                        </div>
                    </div>
                </div>

                <div className="mb-5 px-0.5">
                    <h2 className="font-bold text-sm tracking-tight">{storeName}</h2>
                    <p className="text-[13px] text-foreground/80 mt-1 leading-snug whitespace-pre-line text-balance">
                        Track payments and order flow in real time.
                    </p>
                </div>

                <div className="flex gap-2 w-full">
                    <Button
                        className="flex-1 rounded-md font-semibold text-xs"
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`${adminHref}/products`)}
                    >
                        View Products
                    </Button>
                    <Button
                        className="flex-1 rounded-md font-semibold text-xs"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(adminHref)}
                    >
                        Dashboard
                    </Button>
                </div>
            </div>

            {/* Orders list */}
            <div className="px-4 pt-2">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Recent orders</h3>
                    <span className="text-xs text-muted-foreground">Tap row for details</span>
                </div>
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-60">
                        <div className="size-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-4">
                            <HugeiconsIcon icon={PackageOpenIcon} className="size-8 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-foreground">No Orders Yet</p>
                        <p className="text-sm mt-1 text-muted-foreground">New orders will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/60">
                        <div className="grid grid-cols-[1.4fr_0.9fr_0.9fr] items-center border-b bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <span>Customer</span>
                            <span className="text-right">Amount</span>
                            <span className="text-right">Status</span>
                        </div>
                        <div className="divide-y">
                            {transactions.map((tx) => {
                                const colors = STATUS_COLORS[tx.status];
                                return (
                                    <button
                                        key={tx.id}
                                        onClick={() => handleOrderClick(tx)}
                                        className="grid w-full grid-cols-[1.4fr_0.9fr_0.9fr] items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/50"
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
