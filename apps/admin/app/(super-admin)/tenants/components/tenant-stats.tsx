import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { UserCircleIcon, UserAdd01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface TenantStatsProps {
    stats: {
        totalTenants: number;
        newThisMonth: number;
        activePlans: number;
    };
    isLoading: boolean;
}

export function TenantStats({ stats, isLoading }: TenantStatsProps) {
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
                    <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                    <HugeiconsIcon icon={UserCircleIcon} className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTenants}</div>
                    <p className="text-xs text-muted-foreground">
                        Total registered tenants
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                    <HugeiconsIcon icon={UserAdd01Icon} className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.newThisMonth}</div>
                    <p className="text-xs text-muted-foreground">
                        Tenants joined this month
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activePlans}</div>
                    <p className="text-xs text-muted-foreground">
                        Tenants on paid plans
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
