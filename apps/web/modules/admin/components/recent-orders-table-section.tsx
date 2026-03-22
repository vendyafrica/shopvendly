"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { cn } from "@shopvendly/ui/lib/utils";
import { OrdersTable } from "./orders-table";
import { type OrderSummaryRow } from "@/modules/admin/models";

type FilterTab = "all" | "Completed" | "Pending" | "Failed";

interface RecentOrdersTableSectionProps {
  rows: OrderSummaryRow[];
  viewAllHref: string;
  title?: string;
  onRowClick?: (row: OrderSummaryRow) => void;
  showToolbar?: boolean;
}

export function RecentOrdersTableSection({
  rows,
  viewAllHref,
  title = "Recent Orders",
  onRowClick,
  showToolbar = true,
}: RecentOrdersTableSectionProps) {
  const [statusFilter, setStatusFilter] = React.useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredRows = React.useMemo(() => {
    let nextRows = rows;

    if (statusFilter !== "all") {
      nextRows = nextRows.filter((row) => row.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      nextRows = nextRows.filter((row) => {
        return (
          row.customer.toLowerCase().includes(q) ||
          row.id.toLowerCase().includes(q) ||
          row.orderId?.toLowerCase().includes(q) ||
          row.amount.toLowerCase().includes(q)
        );
      });
    }

    return nextRows.map((row, index) => ({
      ...row,
      id: String(index + 1).padStart(3, "0"),
    }));
  }, [rows, searchQuery, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <Link href={viewAllHref} className="text-xs font-bold text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-border/40 bg-white shadow-sm">
        {showToolbar && (
          <div className="flex flex-col gap-3 border-b border-border/40 bg-muted/[0.02] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {(["all", "Completed", "Pending", "Failed"] as const).map((tab) => (
                <Button
                  key={tab}
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter(tab)}
                  className={cn(
                    "h-9 text-xs font-medium px-4 transition-all rounded-xl capitalize border border-transparent",
                    statusFilter === tab
                      ? "bg-white border-border/40 shadow-sm text-foreground"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  )}
                >
                  {tab}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-72">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-xl border bg-background pl-9 text-xs font-medium shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
            </div>
          </div>
        )}

        <div className="px-0 pb-1 pt-0">
          <OrdersTable rows={filteredRows} onRowClick={onRowClick} />
        </div>
      </div>
    </div>
  );
}
