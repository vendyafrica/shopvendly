"use client";

/**
 * Dynamic chart component wrappers
 * These components use next/dynamic to code-split heavy chart libraries (recharts)
 * and improve initial bundle size and page load performance.
 */

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";

// Loading skeleton for charts
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

// Dynamic imports with loading states
export const revenue-area-chart-card = dynamic(
    () => import("./revenue-area-chart-card").then((mod) => ({ default: mod.revenue-area-chart-card })),
    {
        loading: () => <ChartSkeleton />,
        ssr: false, // Charts don't need SSR, save server processing time
    }
);

export const top-products-bar-chart-card = dynamic(
    () => import("./top-products-bar-chart-card").then((mod) => ({ default: mod.top-products-bar-chart-card })),
    {
        loading: () => <ChartSkeleton />,
        ssr: false,
    }
);

export const visits-area-chart-card = dynamic(
    () => import("./visits-area-chart-card").then((mod) => ({ default: mod.visits-area-chart-card })),
    {
        loading: () => <ChartSkeleton />,
        ssr: false,
    }
);

// Re-export types for convenience
export type { RevenuePoint } from "./revenue-area-chart-card";
export type { TopProductPoint } from "./top-products-bar-chart-card";
export type { VisitsPoint } from "./visits-area-chart-card";
