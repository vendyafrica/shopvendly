"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@shopvendly/ui/components/avatar";
import {
    Sheet,
    SheetContent
} from "@shopvendly/ui/components/sheet";
import { Badge } from "@shopvendly/ui/components/badge";
import type { TenantBootstrap } from "@/features/dashboard/context/tenant-context";
import { SegmentedStatsCard } from "@/features/dashboard/components/segmented-stats-card";
import type { TransactionRow } from "@/features/dashboard/components/recent-transactions-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, Invoice01Icon, Store01Icon } from "@hugeicons/core-free-icons";

interface TransactionsMobileViewProps {
    bootstrap: TenantBootstrap | null;
    transactions: TransactionRow[];
    statSegments: {
        label: string;
        value: string | number;
        changeLabel: string;
        changeTone: "neutral" | "positive" | "negative";
    }[];
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
    statSegments,
}: TransactionsMobileViewProps) {
    const [selectedTx, setSelectedTx] = React.useState<TransactionRow | null>(null);
    const [sheetOpen, setSheetOpen] = React.useState(false);

    const storeInitials = bootstrap?.storeName?.substring(0, 2).toUpperCase() || "SV";

    return (
        <div className="flex flex-col min-h-screen bg-background pb-20 fade-in-0 duration-500 animate-in">
            {/* Header section resembling a profile header */}
            <div className="px-5 pt-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="size-12 border border-border/50">
                        {bootstrap?.storeLogoUrl ? (
                            <img src={bootstrap.storeLogoUrl} alt={bootstrap.storeName} className="object-cover" />
                        ) : (
                            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                {storeInitials}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-lg leading-tight flex items-center gap-1.5">
                            Transactions
                            <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-4 text-blue-500" />
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium">#{bootstrap?.storeSlug}</p>
                    </div>
                </div>
            </div>

            {/* Bio / Description */}
            <div className="px-5 mb-5 space-y-1.5">
                <p className="text-sm">
                    Monitor your store's transactions and revenue flow.
                </p>
            </div>

            {/* Stats section */}
            <div className="px-5 mb-6">
                <SegmentedStatsCard segments={statSegments} />
            </div>

            <div className="w-full h-[1px] bg-border/40" />

            {/* Navigation Tabs */}
            <div className="flex w-full border-b border-border/40">
                <div className="flex-1 py-3.5 flex justify-center items-center border-b-[1.5px] border-foreground">
                    <HugeiconsIcon icon={Invoice01Icon} className="size-[22px] text-foreground" />
                </div>
                <div className="flex-1 py-3.5 flex justify-center items-center text-muted-foreground opacity-50">
                    <HugeiconsIcon icon={Store01Icon} className="size-[22px]" />
                </div>
            </div>

            {/* Transactions List */}
            <div className="flex flex-col px-4 pt-4 gap-3">
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="size-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-4">
                            <HugeiconsIcon icon={Invoice01Icon} className="size-8 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-foreground">No Transactions Yet</p>
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

                            <div className="h-[1px] w-full bg-border" />

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
