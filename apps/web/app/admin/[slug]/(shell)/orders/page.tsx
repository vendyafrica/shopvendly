"use client";

import * as React from "react";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { type OrderTableRow, type OrderStatus, type PaymentStatus, type OrderAPIResponse, type OrdersListResponse, type OrderStatsResponse, type OrderSummaryRow } from "@/modules/admin/models";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Download01Icon, 
  Search01Icon,
  AlertCircleIcon,
  FilterIcon
} from "@hugeicons/core-free-icons";
import { OrdersTable } from "@/modules/admin/components/orders-table";
import { OrdersPageSkeleton } from "@/components/ui/page-skeletons";
import { OrdersMobileView } from "./components/orders-mobile-view";
import { cn } from "@shopvendly/ui/lib/utils";
import { useRouter } from "next/navigation";

const API_BASE = "";

export default function OrdersPage() {
    const { bootstrap, error: bootstrapError } = useTenant();
    const router = useRouter();
    const [orders, setOrders] = React.useState<OrderTableRow[]>([]);
    const [stats, setStats] = React.useState<OrderStatsResponse | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [statusFilter, setStatusFilter] = React.useState<"all" | "Completed" | "Pending" | "Failed">("all");
    const [searchQuery, setSearchQuery] = React.useState("");

    // Fetch orders
    const fetchOrders = React.useCallback(async () => {
        if (!bootstrap) return;

        setError(null);
        setIsLoading(true);

        try {
            const storeQuery = bootstrap.storeId ? `?storeId=${encodeURIComponent(bootstrap.storeId)}` : "";
            // Fetch orders + stats in parallel to reduce waterfall
            const [ordersResponse, statsResponse] = await Promise.all([
                fetch(`${API_BASE}/api/orders${storeQuery}`),
                fetch(`${API_BASE}/api/orders/stats${storeQuery}`),
            ]);

            if (!ordersResponse.ok) {
                throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
            }

            const ordersData = (await ordersResponse.json()) as OrdersListResponse;
            const orderList: OrderAPIResponse[] = ordersData.orders || [];

            // Transform API response to table format
            const transformed: OrderTableRow[] = orderList.map((o) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                customerName: o.customerName,
                customerEmail: o.customerEmail,
                status: o.status as OrderStatus,
                paymentStatus: o.paymentStatus as PaymentStatus,
                paymentMethod: o.paymentMethod,
                totalAmount: o.totalAmount,
                currency: o.currency,
                createdAt: o.createdAt,
                items: o.items,
            }));

            setOrders(transformed);

            if (statsResponse.ok) {
                const statsData = (await statsResponse.json()) as OrderStatsResponse;
                setStats(statsData);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load orders");
        } finally {
            setIsLoading(false);
        }
    }, [bootstrap]);

    React.useEffect(() => {
        if (bootstrap) {
            fetchOrders();
        }
    }, [bootstrap, fetchOrders]);

    const currency = stats?.currency || bootstrap?.defaultCurrency || "UGX";

    const renderPrice = (amount: number, currencyCode: string) => {
        const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode, minimumFractionDigits: 0 }).format(amount);
        const match = formatted.match(/^([A-Z]{3})[\s\u00a0]*(.*)$/);
        if (!match) return formatted;
        const [, code, numeric] = match;
        return (
          <span className="inline-flex items-baseline gap-1">
            <span className="text-[10px] font-bold text-muted-foreground/60 align-sub tracking-tight uppercase leading-none">{code}</span>
            <span className="leading-none">{numeric}</span>
          </span>
        );
    };

    const filteredOrders = React.useMemo<OrderSummaryRow[]>(() => {
        let rows = orders.map((o, index) => {
            const productName = o.items?.find((item) => item?.productName)?.productName || "Order";

            return {
                id: (index + 1).toString().padStart(3, '0'),
                orderId: o.orderNumber,
                actualId: o.id, // For detail navigation
                customer: o.customerName,
                amount: renderPrice(o.totalAmount, currency),
                product: productName,
                paymentMethod: o.paymentMethod,
                status: (o.paymentStatus === "paid"
                    ? "Completed"
                    : o.paymentStatus === "failed"
                        ? "Failed"
                        : "Pending") as "Completed" | "Failed" | "Pending",
                date: new Date(o.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
            };
        });

        if (statusFilter !== "all") {
            rows = rows.filter((r) => r.status === statusFilter);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            rows = rows.filter((r) =>
                r.customer.toLowerCase().includes(q) ||
                r.id.toLowerCase().includes(q) ||
                (r.orderId || "").toLowerCase().includes(q)
            );
        }

        return rows;
    }, [orders, statusFilter, searchQuery, currency]);

    const handleRowClick = (row: OrderSummaryRow) => {
        const id = row.actualId;
        if (id && bootstrap?.storeSlug) {
            router.push(`/admin/${bootstrap.storeSlug}/orders/${id}`);
        }
    };

    if (isLoading) {
        return <OrdersPageSkeleton />;
    }

    return (
        <div className="flex-1 space-y-4 px-4 py-4 md:px-8 md:py-6">
            <div className="flex flex-col gap-4">
                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
                        <p className="hidden text-xs text-muted-foreground sm:block">
                            Monitor and manage your store orders in one place.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-muted/40 rounded-lg p-0.5 border border-border/40">
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold hover:bg-background/80 transition-all">
                                <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
                                Export
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold hover:bg-background/80 transition-all">
                                <HugeiconsIcon icon={FilterIcon} className="size-3.5" />
                                Filter
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards Grid */}
                <div className="hidden md:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { 
                            label: "Total Volume", 
                            value: stats ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(stats.totalRevenue) : "—" 
                        },
                        { 
                            label: "Total Orders", 
                            value: stats ? stats.orderCount.toLocaleString() : "—" 
                        },
                        { 
                            label: "Pending", 
                            value: stats ? stats.pendingCount.toLocaleString() : "—" 
                        },
                        { 
                            label: "Refunded", 
                            value: stats ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(stats.refundedAmount) : "—" 
                        }
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
                            <p className="font-semibold">Error loading orders</p>
                            <p className="text-xs opacity-80">{error || bootstrapError}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => fetchOrders()} className="ml-auto">
                            Retry
                        </Button>
                    </div>
                )}

                {/* Desktop Table Content */}
                <div className="hidden md:flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 p-2 sm:flex-row sm:items-center justify-between border-b border-border/40 bg-muted/5">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
                            {(["all", "Completed", "Pending", "Failed"] as const).map((tab) => (
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
                                    {tab}
                                </Button>
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-2 px-1">
                            <div className="relative flex-1 sm:w-72">
                                <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search orders..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 pl-9 text-xs border border-border/60 bg-white/80 focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none w-full font-medium rounded-lg" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-none shadow-none">
                        <OrdersTable rows={filteredOrders} onRowClick={handleRowClick} />
                    </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden">
                    <OrdersMobileView
                        bootstrap={bootstrap}
                        orders={filteredOrders}
                    />
                </div>
            </div>
        </div>
    );
}
