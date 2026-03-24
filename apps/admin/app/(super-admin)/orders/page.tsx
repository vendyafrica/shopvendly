"use client";

import * as React from "react";
import { Card, CardContent } from "@shopvendly/ui/components/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shopvendly/ui/components/table";
import { Skeleton } from "@shopvendly/ui/components/skeleton";
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

const normalizeStatus = (value: string) => value.trim().toLowerCase();

const formatStatusLabel = (value: string) =>
    value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

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

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => {
        const status = normalizeStatus(o.status);
        return status === "completed" || status === "delivered";
    }).length;
    const paidOrders = orders.filter((o) => normalizeStatus(o.paymentStatus) === "paid").length;
    const totalRevenue = orders
        .filter((o) => normalizeStatus(o.paymentStatus) === "paid")
        .reduce((sum, o) => sum + o.totalAmount, 0);

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                {/* Header Skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[210px]" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} size="sm" className="bg-muted/20 border-border/40 shadow-none">
                            <CardContent className="pt-4 flex flex-col gap-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-7 w-24" />
                                <Skeleton className="h-3 w-28" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className="rounded-md border border-border/70 bg-card shadow-sm overflow-hidden">
                    <div className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead><Skeleton className="h-3 w-24" /></TableHead>
                                        <TableHead><Skeleton className="h-3 w-16" /></TableHead>
                                        <TableHead><Skeleton className="h-3 w-20" /></TableHead>
                                        <TableHead><Skeleton className="h-3 w-24" /></TableHead>
                                        <TableHead className="text-right"><Skeleton className="h-3 w-20 ml-auto" /></TableHead>
                                        <TableHead><Skeleton className="h-3 w-20" /></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            {/* Header */}
            <div>
                <p className="text-sm text-muted-foreground">
                    Global orders across all stores
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                    <CardContent className="pt-4 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Total Orders</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">{totalOrders.toString()}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">Across all storefronts</span>
                    </CardContent>
                </Card>

                <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                    <CardContent className="pt-4 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Completed</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">{completedOrders.toString()}</span>
                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Fulfilled</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">Delivered successfully</span>
                    </CardContent>
                </Card>

                <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                    <CardContent className="pt-4 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Paid Orders</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">{paidOrders.toString()}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">Payment received</span>
                    </CardContent>
                </Card>

                <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                    <CardContent className="pt-4 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Total Revenue</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">
                                {new Intl.NumberFormat('en-UG', {
                                    style: 'currency',
                                    currency: 'UGX',
                                    minimumFractionDigits: 0
                                }).format(totalRevenue)}
                            </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">From paid orders</span>
                    </CardContent>
                </Card>
            </div>

            {/* Orders Table */}
            <div className="rounded-md border border-border/70 bg-card shadow-sm overflow-hidden">
                <div className="p-0">
                    {orders.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No orders found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-b border-border/70">
                                        <TableHead className="text-xs font-medium text-muted-foreground">Order #</TableHead>
                                        <TableHead className="text-xs font-medium text-muted-foreground">Store</TableHead>
                                        <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                                        <TableHead className="text-xs font-medium text-muted-foreground">Payment</TableHead>
                                        <TableHead className="text-right text-xs font-medium text-muted-foreground">Amount</TableHead>
                                        <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => {
                                        const normalizedOrderStatus = normalizeStatus(order.status);
                                        const normalizedPaymentStatus = normalizeStatus(order.paymentStatus);

                                        return (
                                            <TableRow key={order.id} className="hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                                                <TableCell className="font-medium text-foreground">{order.orderNumber}</TableCell>
                                                <TableCell className="text-muted-foreground">{order.storeName || <span className="text-muted-foreground/40 italic">N/A</span>}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "px-2 py-0.5 rounded-full text-[10px] font-bold border-0 uppercase tracking-wider",
                                                            (normalizedOrderStatus === "completed" || normalizedOrderStatus === "delivered")
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : normalizedOrderStatus === "cancelled" || normalizedOrderStatus === "delivery_exception"
                                                                    ? "bg-rose-100 text-rose-800"
                                                                    : "bg-amber-100 text-amber-800"
                                                        )}
                                                    >
                                                        {formatStatusLabel(order.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "px-2 py-0.5 rounded-full text-[10px] font-bold border-0 uppercase tracking-wider",
                                                            normalizedPaymentStatus === "paid"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : normalizedPaymentStatus === "failed"
                                                                    ? "bg-rose-100 text-rose-800"
                                                                    : "bg-amber-100 text-amber-800"
                                                        )}
                                                    >
                                                        {formatStatusLabel(order.paymentStatus)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-foreground tabular-nums">
                                                    {new Intl.NumberFormat('en-UG', { style: 'currency', currency: order.currency, minimumFractionDigits: 0 }).format(order.totalAmount)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-nowrap">
                                                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
