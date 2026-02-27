"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";

interface StatCardProps {
    label: string;
    value: string;
    change?: string;
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
            <Card className="border border-border/70 shadow-none bg-card/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                    {change && <div className="h-3 w-32 bg-muted rounded animate-pulse" />}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-border/70 shadow-none bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                {change && <span className={`text-xs font-medium ${changeColorClass}`}>{change}</span>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold text-foreground">{value}</div>
            </CardContent>
        </Card>
    );
}

interface ProductStatsProps {
    totalProducts?: number;
    totalSales?: number;
    activeNow?: number;
    newProducts?: number;
    lowStock?: number;
    isLoading?: boolean;
}

export function ProductStats({
    totalProducts = 0,
    totalSales = 0,
    activeNow = 0,
    newProducts = 0,
    lowStock = 0,
    isLoading = false,
}: ProductStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                label="Total Products"
                value={totalProducts.toLocaleString()}
                isLoading={isLoading}
            />
            <StatCard
                label="Active Now"
                value={activeNow.toLocaleString()}
                isLoading={isLoading}
            />
            <StatCard
                label="Drafts"
                value={`${newProducts}`}
                isLoading={isLoading}
            />
            <StatCard
                label="Low Stock"
                value={lowStock.toLocaleString()}
                change={lowStock > 0 ? "Needs attention" : undefined}
                changeType={lowStock > 0 ? "negative" : "neutral"}
                isLoading={isLoading}
            />
        </div>
    );
}
