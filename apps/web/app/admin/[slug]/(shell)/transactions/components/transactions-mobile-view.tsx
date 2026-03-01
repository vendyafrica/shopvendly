"use client";

import * as React from "react";
import { StoreAvatar } from "@/components/store-avatar";
import {
    Sheet,
    SheetContent
} from "@shopvendly/ui/components/sheet";
import { Badge } from "@shopvendly/ui/components/badge";
import type { TenantBootstrap } from "@/app/admin/context/tenant-context";
import type { TransactionRow } from "@/app/admin/components/recent-transactions-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, Invoice01Icon, Store01Icon, PackageOpenIcon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { useRouter } from "next/navigation";

interface TransactionsMobileViewProps {
    bootstrap: TenantBootstrap | null;
    transactions: TransactionRow[];
}

const STATUS_ICONS = {
    Completed: CheckmarkBadge01Icon,
    Pending: Invoice01Icon,
    Failed: Invoice01Icon,
};

const STATUS_COLORS = {
    Completed: "text-emerald-500 bg-emerald-50 border-emerald-200",
    Pending: "text-amber-500 bg-amber-50 border-amber-200",
    Failed: "text-rose-500 bg-rose-50 border-rose-200",
};

export function TransactionsMobileView({
    bootstrap,
    transactions,
}: TransactionsMobileViewProps) {
    const [selectedTx, setSelectedTx] = React.useState<TransactionRow | null>(null);
    const [sheetOpen, setSheetOpen] = React.useState(false);
    const router = useRouter();

    const storeName = bootstrap?.storeName || "My Store";
    const adminHref = bootstrap?.storeSlug ? `/admin/${bootstrap.storeSlug}` : "/admin";
    const completedCount = transactions.filter((tx) => tx.status === "Completed").length;
    const pendingCount = transactions.filter((tx) => tx.status === "Pending").length;
    const transactionCount = transactions.length;

    return (
        <div className="flex flex-col pb-20 w-full max-w-full overflow-hidden sm:hidden">
            {/* Header Profile Section */}
            <div className="px-5 py-6 border-b">
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
                        className="flex-1 h-8 font-semibold text-xs"
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`${adminHref}/products`)}
                    >
                        View Products
                    </Button>
                    <Button
                        className="flex-1 h-8 font-semibold text-xs"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(adminHref)}
                    >
                        Dashboard
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex w-full items-center justify-center border-b pt-3">
                <div className="flex items-center gap-2 border-b-2 border-primary pb-3 px-8 text-sm font-semibold">
                    <HugeiconsIcon icon={Invoice01Icon} className="size-5" />
                    <span className="sr-only">Transactions</span>
                </div>
                <div className="flex items-center gap-2 border-b-2 border-transparent pb-3 px-8 text-muted-foreground">
                    <HugeiconsIcon icon={Store01Icon} className="size-5" />
                    <span className="sr-only">Store</span>
                </div>
            </div>

            {/* Transactions List */}
            <div className="flex flex-col px-4 pt-4 gap-3">
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-60">
                        <div className="size-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-4">
                            <HugeiconsIcon icon={PackageOpenIcon} className="size-8 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-foreground">No Orders Yet</p>
                        <p className="text-sm mt-1 text-muted-foreground">New transactions will appear here.</p>
                    </div>
                ) : (
                    transactions.map((tx) => {
                        const Icon = STATUS_ICONS[tx.status];
                        const colors = STATUS_COLORS[tx.status];

                        return (
                            <button
                                key={tx.id}
                                onClick={() => {
                                    setSelectedTx(tx);
                                    setSheetOpen(true);
                                }}
                                className="w-full text-left flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`shrink-0 size-10 rounded-full flex items-center justify-center border ${colors}`}>
                                        <HugeiconsIcon icon={Icon} className="size-5" />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-semibold text-sm truncate">{tx.customer || "Guest"}</span>
                                        <span className="text-xs text-muted-foreground truncate">{tx.date}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0 pl-3">
                                    <span className="font-bold text-sm">{tx.amount}</span>
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm mt-1 uppercase ${colors.replace("border-", "border border-").replace("text-", "text-").replace("bg-", "bg-/50 ")}`}>
                                        {tx.status}
                                    </span>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Transaction Detail Bottom Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-[24px] px-6 pb-8 pt-4 max-h-[85vh] flex flex-col">
                    <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-6 shrink-0" />

                    {selectedTx && (
                        <div className="flex flex-col gap-6 overflow-y-auto">
                            {/* Header */}
                            <div className="flex flex-col items-center justify-center text-center gap-2">
                                <div className={`size-16 rounded-full flex items-center justify-center border-2 ${STATUS_COLORS[selectedTx.status]}`}>
                                    <HugeiconsIcon icon={STATUS_ICONS[selectedTx.status]} className="size-8" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold">{selectedTx.amount}</h2>
                                    <Badge variant="outline" className={`px-2 py-0 border uppercase text-[10px] ${STATUS_COLORS[selectedTx.status]}`}>
                                        {selectedTx.status}
                                    </Badge>
                                </div>
                            </div>

                            <div className="h-px w-full bg-border" />

                            {/* Details Details */}
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-muted-foreground font-medium">Customer</span>
                                    <span className="text-sm font-semibold text-right">{selectedTx.customer || "Guest"}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-muted-foreground font-medium">Order ID</span>
                                    <span className="text-sm font-semibold text-right font-mono">{selectedTx.id}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-muted-foreground font-medium">Items</span>
                                    <span className="text-sm font-semibold text-right">{selectedTx.product}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-muted-foreground font-medium">Payment Method</span>
                                    <span className="text-sm font-semibold text-right uppercase">{selectedTx.payment.replace(/_/g, " ")}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-muted-foreground font-medium">Date</span>
                                    <span className="text-sm font-semibold text-right">{selectedTx.date}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
