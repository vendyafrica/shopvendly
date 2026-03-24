"use client";

import * as React from "react";
import Link from "next/link";
import { StoreAvatar } from "@/components/store-avatar";
import { type TenantBootstrap } from "@/modules/admin/context";
import { type OrderSummaryRow } from "@/modules/admin/models";
import { HugeiconsIcon } from "@hugeicons/react";
import { PackageOpenIcon, Invoice01Icon, Share01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Badge } from "@shopvendly/ui/components/badge";
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
    const [activeTab, setActiveTab] = React.useState<"completed" | "pending">("completed");

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

    const filteredTransactions = transactions.filter((tx) => {
        if (activeTab === "completed") return tx.status === "Completed";
        return tx.status === "Pending";
    });

    return (
        <div className="-mx-4 -mt-4 flex flex-col w-[calc(100%+2rem)] sm:hidden bg-white min-h-screen font-sans">
            {/* Refined Profile Header */}
            <div className="px-1 pt-6 pb-2 border-b border-slate-100 italic-style">
                <div className="flex items-center justify-between mb-6 px-5">
                    <div className="relative">
                        <div className="size-[88px] rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                             <StoreAvatar
                                 storeName={storeName}
                                 logoUrl={bootstrap?.storeLogoUrl}
                                 size="lg"
                                 shape="square"
                                 className="size-[58px] rounded-[24px] border-none"
                             />
                         </div>
                     </div>
 
                     <div className="flex-1 flex justify-around items-center pl-6">
                         <div className="flex flex-col items-center">
                             <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">{transactionCount}</span>
                             <span className="text-[13px] text-slate-500 font-medium">Orders</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">{completedCount}</span>
                             <span className="text-[13px] text-slate-500 font-medium">Paid</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">{pendingCount}</span>
                             <span className="text-[13px] text-slate-500 font-medium">Pending</span>
                         </div>
                     </div>
                 </div>
 
                 <div className="space-y-1 mb-6 px-5">
                     <h1 className="font-extrabold text-[16px] tracking-tight text-slate-900">{storeName}</h1>
                     <p className="text-[14px] text-slate-600 leading-[1.5] max-w-[95%]">
                         {bootstrap?.storeDescription || "Track payments and order flow in real time."}
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
                         className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[13px] rounded-lg shadow-none border-none transition-all active:scale-[0.97]"
                         onClick={() => router.push(`${adminHref}/products`)}
                     >
                         View Products
                     </Button>
                     <Button
                         size="sm"
                         className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] rounded-lg shadow-none border-none transition-all active:scale-[0.97]"
                         onClick={() => router.push(adminHref)}
                     >
                         Dashboard
                     </Button>
                 </div>

                 {/* Instagram Style Tabs */}
                 <div className="flex w-full mt-2">
                     <button
                        onClick={() => setActiveTab("completed")}
                        className={cn(
                            "flex-1 flex justify-center py-3 border-b-2 transition-colors",
                            activeTab === "completed" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400"
                        )}
                     >
                        <HugeiconsIcon icon={Invoice01Icon} className="size-6" />
                     </button>
                     <button
                        onClick={() => setActiveTab("pending")}
                        className={cn(
                            "flex-1 flex justify-center py-3 border-b-2 transition-colors",
                            activeTab === "pending" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400"
                        )}
                     >
                        <HugeiconsIcon icon={PackageOpenIcon} className="size-6" />
                     </button>
                 </div>
             </div>
 
             {/* Orders list - Redesigned as Premium Cards */}
             <div className="px-1 py-6 pb-20">
                <div className="px-5 mb-4 flex items-center justify-between">
                    <h3 className="text-[15px] font-extrabold tracking-tight text-slate-900 capitalize">{activeTab} Orders</h3>
                    <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border-emerald-500/30 text-emerald-600 bg-emerald-500/5">Live Updates</Badge>
                </div>

                <div className="flex flex-col gap-3">
                    {filteredTransactions.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center opacity-80 rounded-[32px] border-2 border-dashed border-border/40 bg-muted/5 mx-3">
                            <div className="size-20 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center mb-5 bg-background shadow-sm">
                                <HugeiconsIcon icon={PackageOpenIcon} className="size-10 text-muted-foreground/40" />
                            </div>
                            <p className="font-bold text-foreground">No {activeTab} orders yet</p>
                            <p className="text-[13px] text-muted-foreground mt-1 px-8 text-balance">Track payments and order flow in real time.</p>
                        </div>
                    ) : (
                        filteredTransactions.map((tx) => {
                            return (
                                <div
                                    key={tx.id}
                                    onClick={() => handleOrderClick(tx)}
                                    className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:border-blue-200/50 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer relative overflow-hidden"
                                >
                                    <div className="size-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                                        <HugeiconsIcon icon={Invoice01Icon} className="size-6 text-slate-400" />
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <p className="font-bold text-sm text-foreground truncate group-hover:text-blue-700 transition-colors capitalize">
                                            {tx.customer || "Guest Checkout"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground font-medium">
                                            {tx.date}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end shrink-0 gap-1.5">
                                        <span className="font-bold text-[14px] text-foreground tracking-tight">
                                            {tx.amount}
                                        </span>
                                        <span className={cn(
                                            "text-[9px] font-bold px-2 py-0.5 rounded-full border-none uppercase tracking-wide",
                                            tx.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" :
                                            tx.status === "Pending" ? "bg-amber-500/10 text-amber-600" :
                                            "bg-red-500/10 text-red-600"
                                        )}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
