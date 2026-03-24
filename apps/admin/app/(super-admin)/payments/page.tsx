"use client";

import * as React from "react";
import { SegmentedStatsCard } from "@/features/super-admin/components/segmented-stats-card";
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

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            {/* Header */}
            <div>
                <p className="text-sm text-muted-foreground">
                    Global payments history across all stores
                </p>
            </div>

            {/* Stats */}
            <SegmentedStatsCard
                segments={[
                    {
                        label: "Total Payments",
                        value: isLoading ? "—" : totalPayments.toString(),
                        changeLabel: "All transactions",
                        changeTone: "neutral",
                    },
                    {
                        label: "Successful",
                        value: isLoading ? "—" : successfulPayments.toString(),
                        changeLabel: "Paid orders",
                        changeTone: "positive",
                    },
                    {
                        label: "Total Revenue",
                        value: isLoading ? "—" : new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(totalRevenue),
                        changeLabel: "From paid orders",
                        changeTone: "positive",
                    },
                    {
                        label: "Success Rate",
                        value: isLoading ? "—" : `${Math.round(successRate)}%`,
                        changeLabel: "Payment completion",
                        changeTone: successRate > 80 ? "positive" : successRate > 50 ? "neutral" : "negative",
                    },
                ]}
            />

            {/* Payments Table */}
            <div className="rounded-md border border-border/70 bg-card shadow-sm overflow-hidden">
                <div className="p-0">
                    {isLoading ? (
                        <div className="p-6 text-sm text-muted-foreground">Loading payments...</div>
                    ) : payments.length === 0 ? (
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
