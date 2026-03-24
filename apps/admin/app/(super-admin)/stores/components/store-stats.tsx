import { Card, CardContent } from "@shopvendly/ui/components/card";
import { Skeleton } from "@shopvendly/ui/components/skeleton";
import { Store01Icon as StoreIcon, Coins01Icon as DollarSignIcon, Analytics01Icon as TrendingUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface StoreStatsProps {
    stats: {
        totalStores: number;
        totalRevenue: number;
        totalSales: number;
    };
    isLoading: boolean;
}

export function StoreStats({ stats, isLoading }: StoreStatsProps) {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} size="sm" className="bg-muted/20 border-border/40 shadow-none">
                        <CardContent className="pt-4 flex flex-col gap-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-7 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                <CardContent className="pt-4 flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Total Stores</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold tracking-tight text-foreground">{stats.totalStores}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">Active storefronts</span>
                </CardContent>
            </Card>

            <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                <CardContent className="pt-4 flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Total Revenue</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold tracking-tight text-foreground">
                            {new Intl.NumberFormat("en-UG", {
                                style: "currency",
                                currency: "UGX",
                                minimumFractionDigits: 0
                            }).format(stats.totalRevenue)}
                        </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">Across all stores</span>
                </CardContent>
            </Card>

            <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                <CardContent className="pt-4 flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Total Sales</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold tracking-tight text-foreground">{stats.totalSales}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">Completed orders</span>
                </CardContent>
            </Card>
        </div>
    );
}
