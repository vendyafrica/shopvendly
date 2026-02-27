"use client";

import * as React from "react";
import { segmented-stats-card } from "../components/segmented-stats-card";
import { Badge } from "@shopvendly/ui/components/badge";
import { cn } from "@shopvendly/ui/lib/utils";

interface Payment {
    id: string;
    provider: string;
    providerReference: string | null;
    status: string;
    amount: number;
    currency: string;
    createdAt: Date;
    orderNumber: string | null;
    storeName: string | null;
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
                <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
                <p className="text-sm text-muted-foreground">
                    Global payments history across all stores
                </p>
            </div>

            {/* Stats */}
            <segmented-stats-card
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
            <div className="rounded-md border border-border/70 bg-card shadow-sm">
                <div className="p-6">
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading payments...</p>
                    ) : payments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No payments found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border/70">
                                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Provider</th>
                                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Reference</th>
                                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Store</th>
                                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Order #</th>
                                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Amount</th>
                                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="border-b border-border/50 last:border-0">
                                            <td className="p-3 text-sm">{payment.provider}</td>
                                            <td className="p-3 font-mono text-xs text-muted-foreground">{payment.providerReference || 'N/A'}</td>
                                            <td className="p-3 text-sm">{payment.storeName || 'N/A'}</td>
                                            <td className="p-3 text-sm">{payment.orderNumber || 'N/A'}</td>
                                            <td className="p-3">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-normal border-0",
                                                        payment.status === "PAID"
                                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700"
                                                            : payment.status === "FAILED"
                                                                ? "bg-rose-100 text-rose-700 hover:bg-rose-100 hover:text-rose-700"
                                                                : "bg-amber-100 text-amber-700 hover:bg-amber-100 hover:text-amber-700"
                                                    )}
                                                >
                                                    {payment.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-right text-sm font-medium">
                                                {new Intl.NumberFormat('en-UG', { style: 'currency', currency: payment.currency }).format(payment.amount)}
                                            </td>
                                            <td className="p-3 text-sm text-muted-foreground">
                                                {new Date(payment.createdAt).toLocaleDateString()}
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
