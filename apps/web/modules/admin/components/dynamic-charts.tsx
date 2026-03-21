"use client";


import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";

function ChartSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn("w-full", className)}>
            <CardHeader className="space-y-1 pb-2">
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent className="px-3 pb-4 md:px-5">
                <div className="aspect-auto h-[260px] w-full md:h-[320px] bg-muted animate-pulse rounded" />
            </CardContent>
        </Card>
    );
}

export const RevenueAreaChartCard = dynamic(
    () => import("./revenue-area-chart-card").then((mod) => ({ default: mod.RevenueAreaChartCard })),
    {
        loading: () => <ChartSkeleton />,
        ssr: false,
    }
);

export const TopProductsBarChartCard = dynamic(
    () => import("./top-products-bar-chart-card").then((mod) => ({ default: mod.TopProductsBarChartCard })),
    {
        loading: () => <ChartSkeleton />,
        ssr: false,
    }
);

export const VisitsAreaChartCard = dynamic(
    () => import("./visits-area-chart-card").then((mod) => ({ default: mod.VisitsAreaChartCard })),
    {
        loading: () => <ChartSkeleton />,
        ssr: false,
    }
);

export const TotalSalesBreakdownCard = dynamic(
    () => import("./total-sales-breakdown-card").then((mod) => ({ default: mod.TotalSalesBreakdownCard })),
    {
        loading: () => <ChartSkeleton />,
        ssr: false,
    }
);

// Re-export types for convenience
export type { RevenuePoint } from "./revenue-area-chart-card";
export type { TopProductPoint } from "./top-products-bar-chart-card";
export type { VisitsPoint } from "./visits-area-chart-card";
