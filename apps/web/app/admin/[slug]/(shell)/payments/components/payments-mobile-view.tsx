"use client";

import * as React from "react";
import { StoreAvatar } from "@/components/store-avatar";
import { type TenantBootstrap } from "@/modules/admin/context";
import { type OrderSummaryRow } from "@/modules/admin/models";
import { HugeiconsIcon } from "@hugeicons/react";
import { Invoice01Icon, Payment02Icon, PackageOpenIcon, Share01Icon, AnalyticsUpIcon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Badge } from "@shopvendly/ui/components/badge";
import { CollectoPayoutCard } from "@/modules/admin/components/collecto-payout-card";
import { useRouter } from "next/navigation";
import { cn } from "@shopvendly/ui/lib/utils";
import Link from "next/link";

interface PaymentsMobileViewProps {
    bootstrap: TenantBootstrap | null;
    revenue: number;
    walletBalance: number;
    bulkBalance: number;
    withdrawable: number;
    currency: string;
    transactions: OrderSummaryRow[];
}

const STATUS_COLORS = {
    Completed: "text-emerald-600 bg-emerald-50 border-emerald-100",
    Pending: "text-amber-600 bg-amber-50 border-amber-100",
    Failed: "text-rose-600 bg-rose-50 border-rose-100",
};

export function PaymentsMobileView({
    bootstrap,
    revenue,
    walletBalance,
    bulkBalance,
    withdrawable,
    currency,
    transactions,
}: PaymentsMobileViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState<"payments" | "analysis">("payments");

    const storeName = bootstrap?.storeName || "My Store";
    const storeSlug = bootstrap?.storeSlug || "";
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

    const filteredTransactions = transactions.filter((tx) => {
        if (activeTab === "payments") return true; 
        return tx.status === "Completed"; 
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
                             <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">{formatCurrency(revenue)}</span>
                             <span className="text-[13px] text-slate-500 font-medium">Revenue</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">{formatCurrency(withdrawable)}</span>
                             <span className="text-[13px] text-slate-500 font-medium">Withdrawable</span>
                         </div>
                     </div>
                 </div>
 
                 <div className="space-y-1 mb-6 px-5">
                     <h1 className="font-extrabold text-[16px] tracking-tight text-slate-900">{storeName}</h1>
                     <p className="text-[14px] text-slate-600 leading-[1.5] max-w-[95%]">
                         {bootstrap?.storeDescription || "Manage your earnings and payouts in real-time."}
                     </p>
                     <Link
                         href={storeSlug ? `https://${storeSlug}.shopvendly.com` : "#"}
                         target="_blank"
                         className="text-[14px] text-primary/90 font-bold hover:underline flex items-center gap-1 mt-1"
                     >
                         {storeSlug ? `shopvendly.com/${storeSlug}` : "shopvendly.com"}
                         <HugeiconsIcon icon={Share01Icon} className="size-3.5" />
                     </Link>
                 </div>
 
                 <div className="flex gap-2.5 px-5 mb-6">
                     <Button
                         size="sm"
                         className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[13px] rounded-lg shadow-none border-none transition-all active:scale-[0.97]"
                         onClick={() => router.push(`${adminHref}/orders`)}
                     >
                         View Orders
                     </Button>
                     <Button
                         size="sm"
                         className="flex-1 h-10 bg-primary/90 hover:bg-primary/80 text-white font-bold text-[13px] rounded-lg shadow-none border-none transition-all active:scale-[0.97]"
                         onClick={() => router.push(adminHref)}
                     >
                         Dashboard
                     </Button>
                 </div>

                 {/* Instagram Style Tabs */}
                 <div className="flex w-full mt-2">
                     <button
                        onClick={() => setActiveTab("payments")}
                        className={cn(
                            "flex-1 flex justify-center py-3 border-b-2 transition-colors",
                            activeTab === "payments" ? "border-primary/90 text-primary/90" : "border-transparent text-slate-400"
                        )}
                     >
                        <HugeiconsIcon icon={Invoice01Icon} className="size-6" />
                     </button>
                     <button
                        onClick={() => setActiveTab("analysis")}
                        className={cn(
                            "flex-1 flex justify-center py-3 border-b-2 transition-colors",
                            activeTab === "analysis" ? "border-primary/90 text-primary/90" : "border-transparent text-slate-400"
                        )}
                     >
                        <HugeiconsIcon icon={AnalyticsUpIcon} className="size-6" />
                     </button>
                 </div>
             </div>
 
             {/* Main Content Area */}
             <div className="flex flex-col flex-1 bg-slate-50/30">
                {activeTab === "payments" ? (
                    <div className="flex flex-col gap-6 py-6 pb-20">
                        {/* Payout Card Section */}
                        <div className="px-5">
                            <CollectoPayoutCard />
                        </div>

                         {/* Quick Stats Cards */}
                        <div className="px-5 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">In Wallet</span>
                                    <HugeiconsIcon icon={Payment02Icon} className="size-3.5 text-slate-300" />
                                </div>
                                <p className="text-base font-extrabold text-slate-900">{formatCurrency(walletBalance)}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">In Bulk</span>
                                    <HugeiconsIcon icon={Payment02Icon} className="size-3.5 text-slate-300" />
                                </div>
                                <p className="text-base font-extrabold text-slate-900">{formatCurrency(bulkBalance)}</p>
                            </div>
                        </div>

                        {/* Recent Transactions List */}
                        <div className="px-1">
                            <div className="px-4 mb-4 flex items-center justify-between">
                                <h3 className="text-[15px] font-extrabold tracking-tight text-slate-900 capitalize">Recent payments</h3>
                                <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border-blue-500/30 text-blue-600 bg-blue-500/5 items-center gap-1 flex">
                                    <div className="size-1 rounded-full bg-blue-500 animate-pulse" />
                                    Live
                                </Badge>
                            </div>

                            <div className="flex flex-col gap-3">
                                {transactions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-60">
                                        <HugeiconsIcon icon={PackageOpenIcon} className="size-12 text-slate-300 mb-4" />
                                        <p className="text-sm font-bold text-slate-500">No Payments Yet</p>
                                    </div>
                                ) : (
                                    transactions.map((tx) => {
                                        return (
                                            <div
                                                key={tx.id}
                                                onClick={() => handleOrderClick(tx)}
                                                className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-blue-200/50 transition-all active:scale-[0.99] cursor-pointer mx-4"
                                            >
                                                <div className="size-12 rounded-xl flex items-center justify-center shrink-0">
                                                    <HugeiconsIcon icon={Invoice01Icon} className="size-6 text-primary/90" />
                                                </div>

                                                <div className="flex-1 min-w-0 flex flex-col">
                                                    <p className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-700 transition-colors capitalize">
                                                        {tx.customer || "Guest Checkout"}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 font-medium">
                                                        {tx.date}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-end shrink-0 gap-1.5">
                                                    <span className="font-bold text-[14px] text-slate-900 tracking-tight">
                                                        {tx.amount}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-bold px-2 py-0.5 rounded-full border-none uppercase tracking-wide",
                                                        tx.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" :
                                                        tx.status === "Pending" ? "bg-amber-500/10 text-amber-600" :
                                                        "bg-rose-500/10 text-rose-600"
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
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-10 text-center opacity-60">
                        <HugeiconsIcon icon={AnalyticsUpIcon} className="size-16 text-slate-200 mb-6" />
                        <h4 className="font-extrabold text-slate-900 mb-2">Detailed Analysis</h4>
                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Detailed revenue breakdown and sales charts are currently only available on the desktop dashboard.</p>
                        <Button
                            variant="outline"
                            className="mt-6 rounded-xl font-bold text-xs"
                            onClick={() => setActiveTab("payments")}
                        >
                            Back to Payments
                        </Button>
                    </div>
                )}
             </div>
        </div>
    );
}
