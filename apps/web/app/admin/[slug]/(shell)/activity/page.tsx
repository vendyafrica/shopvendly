"use client";

import * as React from "react";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { type ActivityEvent, type ActivityEventType } from "@/modules/admin/models/activity";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PackageOpenIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  AlertCircleIcon,
  UserGroupIcon,
  FilterIcon,
  Notification01Icon,
  ArrowRight01Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { cn } from "@shopvendly/ui/lib/utils";

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

import { ActivityMobileView } from "./components/activity-mobile-view";

export default function ActivityPage() {
  const { bootstrap, error: bootstrapError } = useTenant();
  const router = useRouter();
  const [events, setEvents] = React.useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchActivity = React.useCallback(async () => {
    if (!bootstrap?.storeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/activity?storeId=${bootstrap.storeId}`);
      if (!res.ok) throw new Error("Failed to load activity");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setIsLoading(false);
    }
  }, [bootstrap?.storeId]);

  React.useEffect(() => {
    void fetchActivity();
  }, [fetchActivity]);

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
  const handleActivityClick = (event: ActivityEvent) => {
      if (!bootstrap?.storeSlug) return;
      
      const orderId = event.metadata?.orderId;
      const productId = event.metadata?.productId;

      if (orderId) {
          router.push(`/admin/${bootstrap.storeSlug}/orders/${orderId}`);
      } else if (productId) {
          router.push(`/admin/${bootstrap.storeSlug}/products/${productId}`);
      }
  };

  return (
    <div className="flex-1 space-y-4 px-4 py-4 md:px-8 md:py-6">
      <div className="md:hidden">
        <ActivityMobileView 
          bootstrap={bootstrap}
          events={events}
          isLoading={isLoading}
        />
      </div>

      <div className="hidden md:flex flex-col gap-4">
        {/* Desktop Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Live Activity</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Real-time feed of events and alerts from your store.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchActivity()} className="h-8 gap-1.5 text-xs font-semibold">
                Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                <HugeiconsIcon icon={FilterIcon} className="size-3.5" />
                Filter
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex mt-2 flex-col gap-4 max-w-2xl mx-auto md:mx-0 w-full">
        {(error || bootstrapError) && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/25 flex items-center gap-3">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Error loading activity</p>
              <p className="text-xs opacity-80">{error || bootstrapError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchActivity()} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {isLoading && events.length === 0 ? (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border/40 bg-white/50 animate-pulse">
                        <div className="size-10 rounded-xl bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/3" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 rounded-2xl border border-dashed border-border/60 bg-muted/20">
                <HugeiconsIcon icon={Notification01Icon} className="size-12 text-muted-foreground opacity-20" />
                <div>
                   <p className="font-semibold text-muted-foreground">No recent activity</p>
                   <p className="text-xs text-muted-foreground/60">Events will show up here as they happen.</p>
                </div>
            </div>
        ) : (
            <div className="relative space-y-1">
                {/* Timeline vertical line */}
                <div className="absolute left-7 top-4 bottom-4 w-px bg-border/40 hidden sm:block" />

                <div className="space-y-4">
                    {events.map((event, i) => (
                        <div key={event.id} className="relative group">
                            <div className="flex gap-4 items-start rounded-2xl border border-transparent hover:border-border/60 hover:bg-white hover:shadow-sm transition-all p-3 -mx-3">
                                <div className={cn(
                                    "relative z-10 size-10 flex items-center justify-center rounded-xl border-2 shadow-sm shrink-0 transition-transform group-hover:scale-105",
                                    getActivityBg(event.type)
                                )}>
                                    {getActivityIcon(event.type)}
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-sm font-bold text-neutral-900 truncate tracking-tight">{event.title}</p>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded shrink-0">
                                            {getTimeLabel(event.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{event.description}</p>
                                    
                                    <div className="mt-3 flex items-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleActivityClick(event)}
                                            className="h-7 text-[10px] font-bold px-2 uppercase tracking-wide hover:bg-primary/5 hover:text-primary transition-all rounded-lg group/btn"
                                        >
                                            View details
                                            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {!isLoading && events.length > 0 && (
            <div className="py-8 text-center">
                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">End of recent activity</p>
            </div>
        )}
      </div>
    </div>
  );
}
