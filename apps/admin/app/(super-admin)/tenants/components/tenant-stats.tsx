import { Card, CardContent } from "@shopvendly/ui/components/card";
import { Skeleton } from "@shopvendly/ui/components/skeleton";
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
                    <Card key={i} size="sm" className="bg-muted/20 border-border/40 shadow-none">
                        <CardContent className="pt-4 flex flex-col gap-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-7 w-28" />
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
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Total Tenants</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold tracking-tight text-foreground">{stats.totalTenants}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">Total registered tenants</span>
                </CardContent>
            </Card>

            <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                <CardContent className="pt-4 flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">New This Month</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold tracking-tight text-foreground">{stats.newThisMonth}</span>
                        {stats.newThisMonth > 0 && <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">New</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">Tenants joined recently</span>
                </CardContent>
            </Card>

            <Card size="sm" className="bg-muted/20 border-border/40 shadow-none">
                <CardContent className="pt-4 flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Active Plans</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold tracking-tight text-foreground">{stats.activePlans}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">Tenants on paid plans</span>
                </CardContent>
            </Card>
        </div>
    );
}
