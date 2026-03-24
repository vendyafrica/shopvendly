"use client";

import * as React from "react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@shopvendly/ui/components/avatar";
import {
    Sheet,
    SheetContent
} from "@shopvendly/ui/components/sheet";
import { Badge } from "@shopvendly/ui/components/badge";
import { type TenantBootstrap } from "@/modules/admin/context";
import { SegmentedStatsCard } from "@/modules/admin/components/segmented-stats-card";
import { type CustomerRow } from "@/modules/admin/models";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserMultiple02Icon, Mail02Icon, ShoppingCart01Icon, AnalyticsUpIcon, CheckmarkBadge01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@shopvendly/ui/components/input";
import { cn } from "@shopvendly/ui/lib/utils";

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
    const [searchQuery, setSearchQuery] = React.useState("");

    const storeInitials = bootstrap?.storeName?.substring(0, 2).toUpperCase() || "SV";
    const filteredCustomers = React.useMemo(() => {
        if (!searchQuery.trim()) return customers;
        const q = searchQuery.toLowerCase();
        return customers.filter((customer) => {
            return (
                customer.name.toLowerCase().includes(q) ||
                customer.email.toLowerCase().includes(q) ||
                customer.status.toLowerCase().includes(q)
            );
        });
    }, [customers, searchQuery]);

    return (
        <div className="flex min-h-screen flex-col bg-background pb-24 fade-in-0 duration-500 animate-in">
            <div className="px-5 pt-8 pb-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
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

                <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-blue-50/30 p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none text-blue-600 -rotate-12 translate-x-4 -translate-y-2 group-hover:scale-110 transition-transform duration-700">
                        <HugeiconsIcon icon={UserMultiple02Icon} size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[13px] font-medium text-muted-foreground leading-relaxed">
                            Track your customer growth and <br/>engagement metrics in real-time.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            {statSegments.slice(0, 2).map((segment) => (
                                <div key={segment.label} className="rounded-2xl border border-border/40 bg-white/50 backdrop-blur-sm p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{segment.label}</p>
                                        <span className={cn(
                                            "flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
                                            segment.changeTone === "positive" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                                        )}>
                                            {segment.changeLabel}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold tracking-tight text-foreground">{segment.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 mb-6">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <HugeiconsIcon icon={Search01Icon} className="size-4.5 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
                    </div>
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email or status..."
                        className="h-12 rounded-[18px] border-border/60 bg-white pl-10.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all text-sm"
                    />
                </div>
            </div>

            <div className="px-5 mb-6">
                <SegmentedStatsCard segments={statSegments} />
            </div>

            <div className="flex w-full border-b border-border/40 bg-background/80 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex-1 py-4 flex justify-center items-center border-b-2 border-blue-600 relative">
                    <HugeiconsIcon icon={UserMultiple02Icon} className="size-[22px] text-blue-600" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-t-full" />
                </div>
                <div className="flex-1 py-4 flex justify-center items-center text-muted-foreground/40">
                    <HugeiconsIcon icon={AnalyticsUpIcon} className="size-[22px]" />
                </div>
            </div>

            <div className="flex-1 px-5 pt-6 pb-12">
                <div className="flex items-center justify-between px-1 mb-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        Directory
                        <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{filteredCustomers.length}</span>
                    </h3>
                    <button className="text-[11px] font-bold text-blue-600 active:opacity-60 transition-opacity">Filters</button>
                </div>

                {/* Customers List */}
                <div className="flex flex-col gap-3.5">
                {filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-80 rounded-[32px] border-2 border-dashed border-border/40 bg-muted/5">
                        <div className="size-20 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center mb-5 bg-background shadow-sm">
                            <HugeiconsIcon icon={UserMultiple02Icon} className="size-10 text-muted-foreground/40" />
                        </div>
                        <p className="font-bold text-foreground">No matches found</p>
                        <p className="text-[13px] text-muted-foreground mt-1">Try adjusting your search query</p>
                    </div>
                ) : (
                    filteredCustomers.map((c, i) => {
                        const colors = STATUS_COLORS[c.status];
                        const initials = c.name !== "—" ? c.name.substring(0, 2).toUpperCase() : "?";

                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    setSelectedCustomer(c);
                                    setSheetOpen(true);
                                }}
                                className="w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:border-blue-200/50 hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-[100%] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                <Avatar className="size-11 shrink-0 border-2 border-white shadow-sm ring-1 ring-border/30 overflow-hidden rounded-xl">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-50 to-indigo-50/50 text-blue-600 font-bold text-xs">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-foreground truncate group-hover:text-blue-700 transition-colors leading-tight">{c.name}</h4>
                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                                        <HugeiconsIcon icon={Mail02Icon} className="size-2.5 opacity-50" />
                                        {c.email}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end shrink-0 gap-1.5">
                                    <span className="font-bold text-[13px] text-foreground tracking-tight">
                                        {new Intl.NumberFormat("en-US", { style: "currency", currency: c.currency, minimumFractionDigits: 0 }).format(c.totalSpend)}
                                    </span>
                                    <Badge 
                                        variant="outline" 
                                        className={cn(
                                            "text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border-none ring-1 ring-inset",
                                            c.status === "New" ? "bg-blue-500/10 text-blue-600 ring-blue-500/20" :
                                            c.status === "Active" ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" :
                                            "bg-amber-500/10 text-amber-600 ring-amber-500/20"
                                        )}
                                    >
                                        {c.status}
                                    </Badge>
                                </div>
                            </button>
                        );
                    })
                )}
                </div>
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
