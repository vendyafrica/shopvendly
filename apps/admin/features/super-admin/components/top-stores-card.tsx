"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";

export type StoreData = {
    storeId: string;
    storeName: string | null;
    revenue?: number;
    visits?: number;
    orders?: number;
};

export function TopStoresCard({
    title,
    description,
    stores,
    dataKey = "revenue",
    formatValue,
    className,
}: {
    title: string;
    description: string;
    stores: StoreData[];
    dataKey?: keyof StoreData;
    formatValue?: (store: StoreData) => string;
    className?: string;
}) {
    const totalValue = stores.reduce((acc, curr) => acc + (Number(curr[dataKey]) || 0), 0);
    const formattedTotal = new Intl.NumberFormat("en-US", {
        style: dataKey === "revenue" ? "currency" : "decimal",
        currency: "UGX",
        minimumFractionDigits: 0,
    }).format(totalValue);

    const maxVal = Math.max(...stores.map(s => Number(s[dataKey]) || 0), 1);

    return (
        <Card className={cn("w-full border-border/70 shadow-sm overflow-hidden", className)}>
            <CardHeader className="pb-4 bg-muted/5 border-b border-border/40">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-bold tracking-tight">{title}</CardTitle>
                        <CardDescription className="text-xs">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                    {stores.length === 0 ? (
                        <div className="p-12 text-center text-sm text-muted-foreground italic">
                            No store rankings available yet
                        </div>
                    ) : (
                        stores.map((store, idx) => {
                            const val = Number(store[dataKey]) || 0;
                            const percentage = (val / maxVal) * 100;
                            
                            return (
                                <div key={store.storeId || idx} className="group flex items-center gap-4 p-4 hover:bg-muted/30 transition-all duration-200">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors border border-primary/20">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                                                {store.storeName || "Unnamed Store"}
                                            </span>
                                            <span className="text-sm font-bold tabular-nums text-foreground">
                                                {formatValue ? formatValue(store) : formattedTotal}
                                            </span>
                                        </div>
                                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50 border border-border/20">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]"
                                                style={{ width: `${Math.max(percentage, 2)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                {stores.length > 0 && (
                    <div className="p-3 bg-muted/5 border-t border-border/40 flex justify-between items-center px-4">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Aggregate Total</span>
                        <span className="text-xs font-bold text-primary">{formattedTotal}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
