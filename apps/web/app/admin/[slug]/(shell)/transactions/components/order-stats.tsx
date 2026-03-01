"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";

interface StatCardProps {
    label: string;
    value: string;
    change: string;
    changeType?: "positive" | "negative" | "neutral";
    isLoading?: boolean;
}

function StatCard({ label, value, change, changeType = "neutral", isLoading = false }: StatCardProps) {
    const changeColorClass =
        changeType === "positive"
            ? "text-emerald-600"
            : changeType === "negative"
                ? "text-rose-600"
                : "text-muted-foreground";

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className={`text-xs ${changeColorClass}`}>{change}</p>
            </CardContent>
        </Card>
    );
}

interface OrderStatsProps {
    totalRevenue?: number;
    orderCount?: number;
    pendingCount?: number;
    refundedAmount?: number;
    currency?: string;
    isLoading?: boolean;
}

export function OrderStats({
    totalRevenue = 0,
    orderCount = 0,
    pendingCount = 0,
    refundedAmount = 0,
    currency = "USD",
    isLoading = false,
}: OrderStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                label="Total Revenue"
                value={formatCurrency(totalRevenue)}
                change="+20.1% from last month"
                changeType="positive"
                isLoading={isLoading}
            />
            <StatCard
                label="Orders"
                value={`+${orderCount.toLocaleString()}`}
                change="+180.1% from last month"
                changeType="positive"
                isLoading={isLoading}
            />
            <StatCard
                label="Pending"
                value={pendingCount.toLocaleString()}
                change="+19% from last month"
                changeType="positive"
                isLoading={isLoading}
            />
            <StatCard
                label="Refunded"
                value={formatCurrency(refundedAmount)}
                change="+4.5% from last month"
                changeType="neutral"
                isLoading={isLoading}
            />
        </div>
    );
}
