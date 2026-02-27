"use client";

import * as React from "react";
import { useTenant } from "@/features/dashboard/context/tenant-context";
import { type OrderTableRow, type OrderStatus, type PaymentStatus } from "./components/order-table";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon, FilterIcon } from "@hugeicons/core-free-icons";
import { SegmentedStatsCard } from "@/features/dashboard/components/segmented-stats-card";
import { RecentTransactionsTable } from "@/features/dashboard/components/recent-transactions-table";
import { OrdersPageSkeleton } from "@/components/ui/page-skeletons";
import { TransactionsMobileView } from "./components/transactions-mobile-view";

const API_BASE = "";

interface OrderAPIResponse {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
}

interface OrdersListResponse {
    orders: OrderAPIResponse[];
    total: number;
    page: number;
    limit: number;
}

interface OrderStatsResponse {
    totalRevenue: number;
    orderCount: number;
    pendingCount: number;
    refundedAmount: number;
    currency: string;
}

export default function TransactionsPage() {
    const { bootstrap, error: bootstrapError } = useTenant();
    const [orders, setOrders] = React.useState<OrderTableRow[]>([]);
    const [stats, setStats] = React.useState<OrderStatsResponse | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    // Fetch orders
    const fetchOrders = React.useCallback(async () => {
        if (!bootstrap) return;

        setError(null);
        setIsLoading(true);

        try {
            // Fetch orders + stats in parallel to reduce waterfall
            const [ordersResponse, statsResponse] = await Promise.all([
                fetch(`${API_BASE}/api/orders`),
                fetch(`${API_BASE}/api/orders/stats`),
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

    const statSegments = [
        {
            label: "Total Volume",
            value: stats ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(stats.totalRevenue) : "—",
            changeLabel: "",
            changeTone: "neutral" as const,
        },
        {
            label: "Transactions",
            value: stats ? stats.orderCount.toLocaleString() : "—",
            changeLabel: "",
            changeTone: "neutral" as const,
        },
        {
            label: "Pending",
            value: stats ? stats.pendingCount.toLocaleString() : "—",
            changeLabel: "",
            changeTone: "neutral" as const,
        },
        {
            label: "Refunded",
            value: stats ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(stats.refundedAmount) : "—",
            changeLabel: "",
            changeTone: "neutral" as const,
        },
    ];

    const transactionRows = orders.map((o) => ({
        id: o.orderNumber,
        customer: o.customerName,
        product: o.paymentMethod.replace(/_/g, " "),
        amount: new Intl.NumberFormat("en-US", { style: "currency", currency }).format(o.totalAmount),
        status: (o.paymentStatus === "paid"
            ? "Completed"
            : o.paymentStatus === "failed"
                ? "Failed"
                : "Pending") as "Completed" | "Failed" | "Pending",
        payment: o.paymentMethod,
        date: new Date(o.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
    })) as Parameters<typeof RecentTransactionsTable>[0]["rows"];

    if (isLoading) {
        return <OrdersPageSkeleton />;
    }

    return (
        <div className="md:p-6 p-0">
            {/* Mobile View */}
            <div className="block md:hidden">
                <TransactionsMobileView
                    bootstrap={bootstrap}
                    transactions={transactionRows}
                    statSegments={statSegments}
                />
            </div>

            {/* Desktop View */}
            <div className="hidden md:block space-y-6">
                {bootstrapError && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                        {bootstrapError}
                    </div>
                )}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
                        <p className="text-sm text-muted-foreground">
                            Monitor and manage your transactions in one place.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="gap-2">
                            <HugeiconsIcon icon={Download04Icon} className="h-4 w-4" /> Export
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <HugeiconsIcon icon={FilterIcon} className="h-4 w-4" /> Filter
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                        {error}
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-4"
                            onClick={fetchOrders}
                        >
                            Retry
                        </Button>
                    </div>
                )}

                <SegmentedStatsCard segments={statSegments} />

                <RecentTransactionsTable rows={transactionRows} />
            </div>
        </div>
    );
}
