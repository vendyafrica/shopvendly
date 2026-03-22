"use client";

import * as React from "react";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { type NotificationRow } from "@/modules/admin/models";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download01Icon,
  Search01Icon,
  AlertCircleIcon,
  Notification01Icon
} from "@hugeicons/core-free-icons";
import { NotificationsTable } from "./NotificationsTable";
import { NotificationsMobileView } from "./components/notifications-mobile-view";
import { cn } from "@shopvendly/ui/lib/utils";

function timeAgo(from: Date, to: Date) {
  const diffMs = Math.max(0, to.getTime() - from.getTime());

  const diffMin = Math.floor(diffMs / (60 * 1000));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function NotificationsPage() {
  const { bootstrap, error: bootstrapError } = useTenant();
  const [notifications, setNotifications] = React.useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const fetchNotifications = React.useCallback(async () => {
    if (!bootstrap?.storeId) return;
    setIsLoading(true);
    setError(null);
    try {
      // For now, we fetch recent orders and map them to notifications as in the previous implementation
      const res = await fetch(`/api/orders?storeId=${bootstrap.storeId}&limit=50`);
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      const orders = data.orders || [];
      
      const now = new Date();
      const mapped: NotificationRow[] = orders.map((o: any) => {
        const summary =
          o.paymentStatus === "paid"
            ? `Payment received for order ${o.orderNumber}`
            : o.paymentStatus === "failed"
              ? `Payment failed for order ${o.orderNumber}`
              : o.paymentStatus === "refunded"
                ? `Order ${o.orderNumber} was refunded`
                : `Order ${o.orderNumber} placed`;

        const actor = o.customerName ? ` • ${o.customerName}` : "";

        return {
          id: o.orderNumber,
          type: "Order" as const,
          summary: `${summary}${actor}`,
          channel: "In-App" as const,
          status: "New" as const,
          time: timeAgo(new Date(o.createdAt), now),
        };
      });
      setNotifications(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [bootstrap?.storeId]);

  React.useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = React.useMemo(() => {
    if (!searchQuery) return notifications;
    const q = searchQuery.toLowerCase();
    return notifications.filter(n => 
      n.summary.toLowerCase().includes(q) || 
      n.id.toLowerCase().includes(q)
    );
  }, [notifications, searchQuery]);

  const total = notifications.length;
  const newCount = notifications.filter(n => n.status === "New").length;

  return (
    <div className="flex-1 space-y-4 px-4 py-4 md:px-8 md:py-6">
      <div className="flex flex-col gap-4">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Recent activity from orders and payments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
                Export
            </Button>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="hidden md:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Notifications", value: total.toLocaleString() },
            { label: "New Alerts", value: newCount.toLocaleString() },
            { label: "Status", value: newCount > 0 ? "Active" : "Quiet" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-white px-6 py-4 shadow-sm">
              <span className="text-[11px] font-bold text-muted-foreground uppercase leading-tight tracking-wider">{stat.label}</span>
              <span className="text-xl font-bold leading-none">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        {(error || bootstrapError) && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/25 flex items-center gap-3">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Error loading notifications</p>
              <p className="text-xs opacity-80">{error || bootstrapError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchNotifications()} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {/* Desktop Table Content */}
        <div className="hidden md:flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
          <div className="flex flex-col gap-3 p-2 sm:flex-row sm:items-center justify-between border-b border-border/40 bg-muted/5">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-9 text-xs font-medium px-4 transition-all rounded-lg bg-white border border-border/40 shadow-sm"
                )}
              >
                All
              </Button>
            </div>
            
            <div className="flex items-center gap-2 px-1">
              <div className="relative flex-1 sm:w-72">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search notifications..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-xs border border-border/60 bg-white/80 focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none w-full font-medium rounded-lg" 
                />
              </div>
            </div>
          </div>

          <div className="border-none shadow-none p-2">
            <NotificationsTable rows={filteredNotifications} />
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <NotificationsMobileView
            bootstrap={bootstrap as any}
            notifications={filteredNotifications}
            statSegments={[
                { label: "Total Notifications", value: total.toLocaleString(), changeLabel: "", changeTone: "neutral" },
                { label: "New Alerts", value: newCount.toLocaleString(), changeLabel: "", changeTone: "neutral" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}