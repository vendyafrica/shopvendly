"use client";

import * as React from "react";
import { SegmentedStatsCard } from "@/features/super-admin/components/segmented-stats-card";
import { Badge } from "@shopvendly/ui/components/badge";
import { cn } from "@shopvendly/ui/lib/utils";

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    currency: string;
    createdAt: Date;
    storeName: string | null;
    tenantName: string | null;
}

export default function OrdersPage() {
    const [orders, setOrders] = React.useState<Order[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        fetch("/api/orders")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setOrders(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    // Calculate stats
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === "COMPLETED" || o.status === "DELIVERED").length;
    const paidOrders = orders.filter(o => o.paymentStatus === "PAID").length;
    const totalRevenue = orders
        .filter(o => o.paymentStatus === "PAID")
        .reduce((sum, o) => sum + o.totalAmount, 0);

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
                <p className="text-sm text-muted-foreground">
                    Global orders across all stores
                </p>
            </div>

            {/* Stats */}
            <SegmentedStatsCard
                segments={[
                    {
                        label: "Total Orders",
                        value: isLoading ? "—" : totalOrders.toString(),
                        changeLabel: "All orders",
                        changeTone: "neutral",
                    },
                    {
                        label: "Completed",
                        value: isLoading ? "—" : completedOrders.toString(),
                        changeLabel: "Fulfilled orders",
                        changeTone: "positive",
                    },
                    {
                        label: "Paid Orders",
                        value: isLoading ? "—" : paidOrders.toString(),
                        changeLabel: "Payment received",
                        changeTone: "positive",
                    },
                    {
                        label: "Total Revenue",
                        value: isLoading ? "—" : new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(totalRevenue),
                        changeLabel: "From paid orders",
                        changeTone: "positive",
                    },
                ]}
            />

            {/* Orders Table */}
            <div className="rounded-md border border-border/70 bg-card shadow-sm">
                <div className="p-6">
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading orders...</p>
                    ) : orders.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No orders found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border/70">
                                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Order #</th>
                                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Store</th>
                                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Payment</th>
                                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Amount</th>
                                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-b border-border/50 last:border-0">
                                            <td className="p-3 text-sm font-medium">{order.orderNumber}</td>
                                            <td className="p-3 text-sm">{order.storeName || 'N/A'}</td>
                                            <td className="p-3">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-normal border-0",
                                                        (order.status === "COMPLETED" || order.status === "DELIVERED")
                                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700"
                                                            : order.status === "CANCELLED"
                                                                ? "bg-rose-100 text-rose-700 hover:bg-rose-100 hover:text-rose-700"
                                                                : "bg-amber-100 text-amber-700 hover:bg-amber-100 hover:text-amber-700"
                                                    )}
                                                >
                                                    {order.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-normal border-0",
                                                        order.paymentStatus === "PAID"
                                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700"
                                                            : order.paymentStatus === "FAILED"
                                                                ? "bg-rose-100 text-rose-700 hover:bg-rose-100 hover:text-rose-700"
                                                                : "bg-amber-100 text-amber-700 hover:bg-amber-100 hover:text-amber-700"
                                                    )}
                                                >
                                                    {order.paymentStatus}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-right text-sm font-medium">
                                                {new Intl.NumberFormat('en-UG', { style: 'currency', currency: order.currency }).format(order.totalAmount)}
                                            </td>
                                            <td className="p-3 text-sm text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
