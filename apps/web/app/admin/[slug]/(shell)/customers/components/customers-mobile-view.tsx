"use client";

import * as React from "react";
import Link from "next/link";
import { StoreAvatar } from "@/components/store-avatar";
import { Avatar, AvatarFallback } from "@shopvendly/ui/components/avatar";
import {
    Sheet,
    SheetContent
} from "@shopvendly/ui/components/sheet";
import { Badge } from "@shopvendly/ui/components/badge";
import { Button } from "@shopvendly/ui/components/button";
import { type TenantBootstrap } from "@/modules/admin/context";
import { type CustomerRow } from "@/modules/admin/models";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@shopvendly/ui/lib/utils";
import { UserMultiple02Icon, Mail02Icon, ShoppingCart01Icon, AnalyticsUpIcon, CheckmarkBadge01Icon, Share01Icon } from "@hugeicons/core-free-icons";

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
    const [activeTab, setActiveTab] = React.useState<"active" | "new">("active");

    const storeName = bootstrap?.storeName || "My Store";

    const filteredCustomers = customers.filter((c) => {
        if (activeTab === "active") return c.status === "Active";
        return c.status === "New";
    });

    return (
        <div className="-mx-4 -mt-4 flex flex-col min-h-screen bg-white pb-20 fade-in-0 duration-500 animate-in font-sans font-sans">
            {/* Refined Profile Header */}
            <div className="px-1 pt-6 pb-2 border-b border-slate-100 italic-style">
                <div className="flex items-center justify-between mb-6 px-5">
                    <div className="relative">
                        <div className="size-[88px] rounded-full border-[1.5px] border-slate-100 overflow-hidden bg-slate-50 shadow-sm">
                             <StoreAvatar
                                 storeName={storeName}
                                 logoUrl={bootstrap?.storeLogoUrl}
                                 size="lg"
                                 className="size-full border-none rounded-full"
                             />
                         </div>
                     </div>
 
                     <div className="flex-1 flex justify-around items-center pl-6">
                         {statSegments.slice(0, 3).map((s, idx) => (
                             <div key={idx} className="flex flex-col items-center">
                                 <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">{s.value}</span>
                                 <span className="text-[13px] text-slate-500 font-medium">{s.label.split(' ')[0]}</span>
                             </div>
                         ))}
                     </div>
                 </div>
 
                 <div className="space-y-1 mb-6 px-5">
                     <h1 className="font-extrabold text-[16px] tracking-tight text-slate-900 flex items-center gap-1.5">
                         {storeName}
                         <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-3.5 text-blue-500" />
                     </h1>
                     <p className="text-[14px] text-slate-600 leading-[1.5] max-w-[95%]">
                         {bootstrap?.storeDescription || "Key insights and details about your customers and their shopping behavior."}
                     </p>
                     <Link
                         href={bootstrap?.storeSlug ? `https://${bootstrap.storeSlug}.shopvendly.com` : "#"}
                         target="_blank"
                         className="text-[14px] text-blue-600 font-bold hover:underline flex items-center gap-1 mt-1"
                     >
                         {bootstrap?.storeSlug ? `shopvendly.com/${bootstrap.storeSlug}` : "shopvendly.com"}
                         <HugeiconsIcon icon={Share01Icon} className="size-3.5" />
                     </Link>
                 </div>
 
                 <div className="flex gap-2.5 px-5 mb-6">
                     <Button
                         size="sm"
                         variant="outline"
                         className="flex-1 h-10 bg-slate-100 border-none text-slate-900 font-bold text-[13px] rounded-lg transition-all active:scale-[0.97] shadow-none hover:bg-slate-200"
                     >
                         Export
                     </Button>
                     <Button
                         size="sm"
                         className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] rounded-lg shadow-none border-none transition-all active:scale-[0.97]"
                     >
                         Add Customer
                     </Button>
                 </div>

                 {/* Instagram Style Tabs */}
                 <div className="flex w-full mt-2">
                     <button
                        onClick={() => setActiveTab("active")}
                        className={cn(
                            "flex-1 flex justify-center py-3 border-b-2 transition-colors",
                            activeTab === "active" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400"
                        )}
                     >
                        <HugeiconsIcon icon={AnalyticsUpIcon} className="size-6" />
                     </button>
                     <button
                        onClick={() => setActiveTab("new")}
                        className={cn(
                            "flex-1 flex justify-center py-3 border-b-2 transition-colors",
                            activeTab === "new" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400"
                        )}
                     >
                        <HugeiconsIcon icon={UserMultiple02Icon} className="size-6" />
                     </button>
                 </div>
             </div>
 
             {/* Customers List - Redesigned as Premium Cards */}
             <div className="px-1 pt-6 pb-20 flex flex-col gap-3">
                <div className="px-5 mb-4 items-center justify-between flex">
                    <h3 className="text-[15px] font-extrabold tracking-tight text-slate-900 capitalize">{activeTab} Customers</h3>
                </div>
                {filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="size-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-4">
                            <HugeiconsIcon icon={UserMultiple02Icon} className="size-8 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-foreground text-center">No {activeTab} customers found</p>
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
