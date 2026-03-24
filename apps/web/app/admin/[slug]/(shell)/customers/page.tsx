"use client";

import * as React from "react";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { useParams } from "next/navigation";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download01Icon,
  Upload01Icon,
  Search01Icon,
  Add01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { CustomersTable } from "./CustomersTable";
import { CustomersMobileView } from "./components/customers-mobile-view";
import { useCustomers } from "@/modules/admin/hooks/use-customers";
import { CustomersPageSkeleton } from "@/components/ui/page-skeletons";
import { cn } from "@shopvendly/ui/lib/utils";

export default function CustomersPage() {
  const { bootstrap } = useTenant();
  const params = useParams();
  const slug = params.slug as string;

  const [statusFilter, setStatusFilter] = React.useState<"all" | "New" | "Active" | "Churn Risk" | "Returning">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: customers = [], isLoading, error: queryError, refetch } = useCustomers(bootstrap?.storeId);

  const displayCustomers = React.useMemo(() => {
    if (slug !== "vendly") return customers;

    return customers.map((customer, index) => ({
      ...customer,
      name: `Customer ${index + 1}`,
      email: `customer${index + 1}@example.com`,
    }));
  }, [customers, slug]);

  const filteredCustomers = React.useMemo(() => {
    let result = displayCustomers;

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [displayCustomers, statusFilter, searchQuery]);

  if (isLoading && customers.length === 0) {
    return <CustomersPageSkeleton />;
  }

  const error = queryError?.message ?? null;

  const totalCustomers = displayCustomers.length;
  const newCount = displayCustomers.filter((c) => c.status === "New").length;
  const activeCount = displayCustomers.filter((c) => c.status === "Active").length;
  const churnCount = displayCustomers.filter((c) => c.status === "Churn Risk").length;
  const returningCount = displayCustomers.filter((c) => c.status === "Returning").length;

  return (
    <div className="flex-1 space-y-4 px-4 py-4 md:px-8 md:py-6">
      <div className="flex flex-col gap-4">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Customers</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Key insights and details about your customers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted/40 rounded-lg p-0.5 border border-border/40">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold hover:bg-background/80 transition-all">
                <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
                Export
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold hover:bg-background/80 transition-all">
                <HugeiconsIcon icon={Upload01Icon} className="size-3.5" />
                Import
              </Button>
            </div>

            <Button size="sm" className="h-8 gap-1.5 text-xs font-medium text-background hover:bg-primary/90 shadow-sm">
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              Add customer
            </Button>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="hidden md:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Customers", value: totalCustomers.toLocaleString() },
            { label: "Returning", value: returningCount.toLocaleString() },
            { label: "Active", value: activeCount.toLocaleString() },
            { label: "New (30 days)", value: newCount.toLocaleString() }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-white px-6 py-4 shadow-sm">
              <span className="text-[11px] font-bold text-muted-foreground uppercase leading-tight tracking-wider">{stat.label}</span>
              <span className="text-xl font-bold leading-none">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/25 flex items-center gap-3">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Error loading customers</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {/* Desktop Table Content */}
        <div className="hidden md:flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">

          <div className="flex flex-col gap-3 p-2 sm:flex-row sm:items-center justify-between border-b border-border/40 bg-muted/5">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
              {(["all", "Returning", "Active", "New", "Churn Risk"] as const).map((tab) => (
                <Button 
                  key={tab}
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStatusFilter(tab)}
                  className={cn(
                    "h-9 text-xs font-medium px-4 transition-all rounded-lg capitalize",
                    statusFilter === tab ? "bg-white border border-border/40 shadow-sm" : "hover:bg-muted/30"
                  )}
                >
                  {tab === "all" ? "All" : tab}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 px-1">
              <div className="relative flex-1 sm:w-72">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search customers..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-xs border border-border/60 bg-white/80 focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none w-full font-medium rounded-lg" 
                />
              </div>
            </div>
          </div>

          <div className="border-none shadow-none">
            <CustomersTable rows={filteredCustomers} storeSlug={slug} />
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <CustomersMobileView
            bootstrap={bootstrap}
            customers={displayCustomers}
            statSegments={[
                { label: "Total Customers", value: totalCustomers.toLocaleString(), changeLabel: "", changeTone: "neutral" },
                { label: "Returning", value: returningCount.toLocaleString(), changeLabel: "", changeTone: "neutral" },
                { label: "Active", value: activeCount.toLocaleString(), changeLabel: "", changeTone: "neutral" },
                { label: "New", value: newCount.toLocaleString(), changeLabel: "", changeTone: "neutral" }
            ]}
          />
        </div>
      </div>
    </div>
  );
}