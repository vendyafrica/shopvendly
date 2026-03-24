"use client";

import * as React from "react";
import Link from "next/link";
import { StoreAvatar } from "@/components/store-avatar";
import { type TenantBootstrap } from "@/modules/admin/context";
import { type ActivityEvent, type ActivityEventType } from "@/modules/admin/models/activity";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
    Notification01Icon, 
    ShoppingBag01Icon, 
    CheckmarkCircle01Icon, 
    Cancel01Icon, 
    AlertCircleIcon, 
    UserGroupIcon,
    ArrowRight01Icon,
    Share01Icon
} from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { useRouter } from "next/navigation";
import { cn } from "@shopvendly/ui/lib/utils";

interface ActivityMobileViewProps {
    bootstrap: TenantBootstrap | null;
    events: ActivityEvent[];
    isLoading: boolean;
}

function getActivityIcon(type: ActivityEventType) {
    switch (type) {
        case "order_placed":
            return <HugeiconsIcon icon={ShoppingBag01Icon} className="size-5 text-blue-600" />;
        case "payment_received":
            return <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-5 text-emerald-600" />;
        case "payment_failed":
            return <HugeiconsIcon icon={Cancel01Icon} className="size-5 text-rose-600" />;
        case "low_stock":
            return <HugeiconsIcon icon={AlertCircleIcon} className="size-5 text-amber-600" />;
        case "customer_registered":
            return <HugeiconsIcon icon={UserGroupIcon} className="size-5 text-indigo-600" />;
        default:
            return <HugeiconsIcon icon={Notification01Icon} className="size-5 text-muted-foreground" />;
    }
}

function getActivityBg(type: ActivityEventType) {
    switch (type) {
        case "order_placed": return "bg-blue-50 border-blue-100";
        case "payment_received": return "bg-emerald-50 border-emerald-100";
        case "payment_failed": return "bg-rose-50 border-rose-100";
        case "low_stock": return "bg-amber-50 border-amber-100";
        case "customer_registered": return "bg-indigo-50 border-indigo-100";
        default: return "bg-muted/50 border-muted-foreground/10";
    }
}

const getTimeLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function ActivityMobileView({
    bootstrap,
    events,
    isLoading,
}: ActivityMobileViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState<"all" | "alerts">("all");

    const storeName = bootstrap?.storeName || "My Store";
    const storeSlug = bootstrap?.storeSlug || "";

    const handleActivityClick = (event: ActivityEvent) => {
        if (!storeSlug) return;
        const orderId = event.metadata?.orderId;
        const productId = event.metadata?.productId;
        if (orderId) {
            router.push(`/admin/${storeSlug}/orders/${orderId}`);
        } else if (productId) {
            router.push(`/admin/${storeSlug}/products/${productId}`);
        }
    };

    const filteredEvents = events.filter((e) => {
        if (activeTab === "all") return true;
        return e.type === "low_stock" || e.type === "payment_failed";
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
                             <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">{events.length}</span>
                             <span className="text-[13px] text-slate-500 font-medium">Events</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">
                                 {events.filter(e => e.type === 'order_placed').length}
                             </span>
                             <span className="text-[13px] text-slate-500 font-medium">Orders</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">
                                 {events.filter(e => e.type === 'payment_received').length}
                             </span>
                             <span className="text-[13px] text-slate-500 font-medium">Paid</span>
                         </div>
                     </div>
                 </div>

                 <div className="space-y-1 mb-6 px-5">
                     <h1 className="font-extrabold text-[16px] capitalize tracking-tight text-slate-900">{storeName}</h1>
                     <p className="text-[14px] text-slate-600 leading-[1.5] max-w-[95%]">
                         {bootstrap?.storeDescription || "Stay updated with real-time store activity and customer events."}
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

                 {/* Instagram-style Tabs */}
                 <div className="flex border-t border-slate-50">
                     <button
                         onClick={() => setActiveTab("all")}
                         className={cn(
                             "flex-1 py-3 text-[13px] font-bold transition-all relative",
                             activeTab === "all" ? "text-slate-900" : "text-slate-400"
                         )}
                     >
                         All Activity
                         {activeTab === "all" && <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-900 mx-8" />}
                     </button>
                     <button
                         onClick={() => setActiveTab("alerts")}
                         className={cn(
                             "flex-1 py-3 text-[13px] font-bold transition-all relative",
                             activeTab === "alerts" ? "text-slate-900" : "text-slate-400"
                         )}
                     >
                         Alerts
                         {activeTab === "alerts" && <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-900 mx-8" />}
                     </button>
                 </div>
            </div>

            {/* Scrollable Events List */}
            <div className="flex-1 bg-slate-50/30 px-4 py-4 space-y-3 pb-24">
                {isLoading && events.length === 0 ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse">
                            <div className="flex gap-3">
                                <div className="size-10 rounded-xl bg-slate-100 shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredEvents.length === 0 ? (
                    <div className="py-20 text-center">
                        <HugeiconsIcon icon={Notification01Icon} className="size-12 mx-auto text-slate-200 mb-2" />
                        <p className="text-slate-400 font-medium">No activity found</p>
                    </div>
                ) : (
                    filteredEvents.map((event) => (
                        <div 
                            key={event.id} 
                            onClick={() => handleActivityClick(event)}
                            className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all"
                        >
                            <div className="flex gap-4">
                                <div className={cn(
                                    "size-10 rounded-xl border flex items-center justify-center shrink-0",
                                    getActivityBg(event.type)
                                )}>
                                    {getActivityIcon(event.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h3 className="font-bold text-slate-900 text-[14px] truncate tracking-tight">{event.title}</h3>
                                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">
                                            {getTimeLabel(event.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
                                        {event.description}
                                    </p>
                                    <div className="mt-2 flex items-center text-blue-600 font-bold text-[11px] uppercase tracking-wider">
                                        Details
                                        <HugeiconsIcon icon={ArrowRight01Icon} className="size-3 ml-1" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
