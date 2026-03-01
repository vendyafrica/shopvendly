"use client";

import * as React from "react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@shopvendly/ui/components/avatar";
import {
    Sheet,
    SheetContent
} from "@shopvendly/ui/components/sheet";
import { Badge } from "@shopvendly/ui/components/badge";
import type { TenantBootstrap } from "@/app/admin/context/tenant-context";
import { SegmentedStatsCard } from "@/app/admin/components/segmented-stats-card";
import type { CustomerRow } from "../CustomersTable";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserMultiple02Icon, Mail02Icon, ShoppingCart01Icon, AnalyticsUpIcon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";

interface CustomersMobileViewProps {
    bootstrap: TenantBootstrap | null;
    customers: CustomerRow[];
    statSegments: {
        label: string;
        value: string | number;
        changeLabel: string;
        changeTone: "neutral" | "positive" | "negative";
    }[];
}

const STATUS_COLORS = {
    "New": "text-blue-500 bg-blue-50 border-blue-200",
    "Active": "text-emerald-500 bg-emerald-50 border-emerald-200",
    "Churn Risk": "text-amber-500 bg-amber-50 border-amber-200",
};

export function CustomersMobileView({
    bootstrap,
    customers,
    statSegments,
}: CustomersMobileViewProps) {
    const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerRow | null>(null);
    const [sheetOpen, setSheetOpen] = React.useState(false);

    const storeInitials = bootstrap?.storeName?.substring(0, 2).toUpperCase() || "SV";

    return (
        <div className="flex flex-col min-h-screen bg-background pb-20 fade-in-0 duration-500 animate-in">
            {/* Header section resembling a profile header */}
            <div className="px-5 pt-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="size-12 border border-border/50">
                        {bootstrap?.storeLogoUrl ? (
                            <Image
                                src={bootstrap.storeLogoUrl}
                                alt={bootstrap.storeName || "Store logo"}
                                width={48}
                                height={48}
                                className="object-cover rounded-full"
                            />
                        ) : (
                            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                {storeInitials}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-lg leading-tight flex items-center gap-1.5">
                            Customers
                            <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-4 text-blue-500" />
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium">
                            {bootstrap?.storeSlug ? `#${bootstrap.storeSlug}` : "Customer insights"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bio / Description */}
            <div className="px-5 mb-5 space-y-1.5">
                <p className="text-sm">
                    Key insights and details about your customers.
                </p>
            </div>

            {/* Stats section */}
            <div className="px-5 mb-6">
                <SegmentedStatsCard segments={statSegments} />
            </div>

            <div className="w-full h-1px bg-border/40" />

            {/* Navigation Tabs */}
            <div className="flex w-full border-b border-border/40">
                <div className="flex-1 py-3.5 flex justify-center items-center border-b-[1.5px] border-foreground">
                    <HugeiconsIcon icon={UserMultiple02Icon} className="size-[22px] text-foreground" />
                </div>
                <div className="flex-1 py-3.5 flex justify-center items-center text-muted-foreground opacity-50">
                    <HugeiconsIcon icon={AnalyticsUpIcon} className="size-[22px]" />
                </div>
            </div>

            {/* Customers List */}
            <div className="flex flex-col px-4 pt-4 gap-3">
                {customers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="size-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-4">
                            <HugeiconsIcon icon={UserMultiple02Icon} className="size-8 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-foreground">No Customers Yet</p>
                    </div>
                ) : (
                    customers.map((c, i) => {
                        const colors = STATUS_COLORS[c.status];
                        const initials = c.name !== "—" ? c.name.substring(0, 2).toUpperCase() : "?";

                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    setSelectedCustomer(c);
                                    setSheetOpen(true);
                                }}
                                className="w-full text-left flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <Avatar className="size-10 shrink-0 border border-border/50 bg-background text-muted-foreground font-semibold">
                                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-semibold text-sm truncate">{c.name}</span>
                                        <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0 pl-3">
                                    <span className="font-bold text-sm">
                                        {new Intl.NumberFormat("en-US", { style: "currency", currency: c.currency, minimumFractionDigits: 0 }).format(c.totalSpend)}
                                    </span>
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm mt-1 uppercase ${colors.replace("border-", "border border-").replace("text-", "text-").replace("bg-", "bg-/50 ")}`}>
                                        {c.status}
                                    </span>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Customer Detail Bottom Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-[24px] px-6 pb-8 pt-4 max-h-[85vh] flex flex-col">
                    <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-6 shrink-0" />

                    {selectedCustomer && (
                        <div className="flex flex-col gap-6 overflow-y-auto">
                            {/* Header */}
                            <div className="flex flex-col items-center justify-center text-center gap-3">
                                <Avatar className="size-16 border-2 border-border shadow-sm">
                                    <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground">
                                        {selectedCustomer.name !== "—" ? selectedCustomer.name.substring(0, 2).toUpperCase() : "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                                    <Badge variant="outline" className={`px-2 py-0 border uppercase text-[10px] ${STATUS_COLORS[selectedCustomer.status]}`}>
                                        {selectedCustomer.status}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="bg-muted/50 border border-border/50 rounded-xl p-4 flex flex-col items-center text-center gap-1">
                                    <HugeiconsIcon icon={ShoppingCart01Icon} className="size-5 text-muted-foreground" />
                                    <p className="text-2xl font-bold mt-1">{selectedCustomer.orders}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Orders</p>
                                </div>
                                <div className="bg-muted/50 border border-border/50 rounded-xl p-4 flex flex-col items-center text-center gap-1">
                                    <HugeiconsIcon icon={AnalyticsUpIcon} className="size-5 text-muted-foreground" />
                                    <p className="text-lg font-bold mt-1">
                                        {new Intl.NumberFormat("en-US", { style: "currency", currency: selectedCustomer.currency, minimumFractionDigits: 0 }).format(selectedCustomer.totalSpend)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Spend</p>
                                </div>
                            </div>

                            <div className="h-1px w-full bg-border/60" />

                            {/* Details*/}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <HugeiconsIcon icon={Mail02Icon} className="size-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex flex-col flex-1 pb-4 border-b border-border/50">
                                        <span className="text-xs text-muted-foreground font-medium">Email Address</span>
                                        <span className="text-sm font-semibold">{selectedCustomer.email}</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <HugeiconsIcon icon={ShoppingCart01Icon} className="size-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex flex-col flex-1 pb-4 border-b border-border/50">
                                        <span className="text-xs text-muted-foreground font-medium">Last Order Date</span>
                                        <span className="text-sm font-semibold">
                                            {selectedCustomer.lastOrder === "1970-01-01T00:00:00.000Z" ? "Never" :
                                                new Date(selectedCustomer.lastOrder).toLocaleString("en-US", {
                                                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
                                                })
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
