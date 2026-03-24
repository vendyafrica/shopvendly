"use client";

import * as React from "react";
import { Badge } from "@shopvendly/ui/components/badge";
import { cn } from "@shopvendly/ui/lib/utils";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shopvendly/ui/components/table";
import { Skeleton } from "@shopvendly/ui/components/skeleton";

import {
    Card,
    CardContent,
} from "@shopvendly/ui/components/card";

interface Payment {
    id: string;
    customerNumber: string | null;
    status: string;
    amount: number;
    currency: string;
    createdAt: string;
    orderNumber: string | null;
    storeName: string | null;
    storeSlug: string | null;
}

export default function PaymentsPage() {
    const [payments, setPayments] = React.useState<Payment[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        fetch("/api/payments")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPayments(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    // Calculate stats
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.status === "PAID").length;
    const totalRevenue = payments
        .filter(p => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0);
    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                {/* Header Skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[240px]" />
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
                                        <TableHead className="text-center"><Skeleton className="h-3 w-20 mx-auto" /></TableHead>
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
                                            <TableCell className="text-center"><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
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
                    Global payments history across all stores
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                    <CardContent className="pt-4 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Total Payments</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">{totalPayments.toString()}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">All transactions</span>
                    </CardContent>
                </Card>

                <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                    <CardContent className="pt-4 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Successful</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">{successfulPayments.toString()}</span>
                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Paid</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">Across all stores</span>
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
                        <span className="text-[10px] text-muted-foreground/60">From completed orders</span>
                    </CardContent>
                </Card>

                <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                    <CardContent className="pt-4 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Success Rate</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">{`${Math.round(successRate)}%`}</span>
                            <span className={cn(
                                "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                successRate > 80 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                            )}>
                                Health
                            </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">Payment efficiency</span>
                    </CardContent>
                </Card>
            </div>

            {/* Payments Table */}
            <div className="rounded-md border border-border/70 bg-card shadow-sm overflow-hidden">
                <div className="p-0">
                    {payments.length === 0 ? (
                        <div className="p-6 text-sm text-muted-foreground">No payments found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer Number</TableHead>
                                        <TableHead>Store Name</TableHead>
                                        <TableHead>Order Link</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium text-foreground text-nowrap">
                                                {payment.customerNumber || (
                                                    <span className="text-muted-foreground/40 font-normal">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {payment.storeName || (
                                                    <span className="text-muted-foreground/40">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {payment.orderNumber && payment.storeSlug ? (
                                                    <a 
                                                        href={`https://${payment.storeSlug}.shopvendly.store/orders/${payment.orderNumber}`} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="text-primary hover:underline font-semibold"
                                                    >
                                                        {payment.orderNumber}
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground/40">{payment.orderNumber || 'N/A'}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold border-0 uppercase tracking-wider",
                                                        payment.status === "PAID"
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : payment.status === "FAILED"
                                                                ? "bg-rose-100 text-rose-800"
                                                                : "bg-amber-100 text-amber-800"
                                                    )}
                                                >
                                                    {payment.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-bold tabular-nums">
                                                {new Intl.NumberFormat('en-UG', {
                                                    style: 'currency',
                                                    currency: payment.currency,
                                                    minimumFractionDigits: 0
                                                }).format(payment.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{new Date(payment.createdAt).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
