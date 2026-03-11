import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
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
                    <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/50" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
                    <HugeiconsIcon icon={StoreIcon} className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalStores}</div>
                    <p className="text-xs text-muted-foreground">
                        Active storefronts
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <HugeiconsIcon icon={DollarSignIcon} className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat("en-UG", {
                            style: "currency",
                            currency: "UGX",
                        }).format(stats.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Across all stores
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <HugeiconsIcon icon={TrendingUpIcon} className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalSales}</div>
                    <p className="text-xs text-muted-foreground">
                        Completed orders
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
