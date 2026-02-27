"use client";

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@shopvendly/ui/components/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

function NameLabel({ x, y, value }: { x?: number; y?: number; value?: string }) {
    if (x == null || y == null || !value) return null;
    return (
        <text x={x} y={y - 10} fill="hsl(var(--foreground))" fontSize={12} fontWeight={600}>
            {value}
        </text>
    );
}

export type StoreData = {
    storeId: string;
    storeName: string | null;
    revenue?: number;
    visits?: number;
    orders?: number;
};

export function top-stores-card({
    title,
    description,
    stores,
    dataKey = "revenue",
    className,
}: {
    title: string;
    description: string;
    stores: StoreData[];
    dataKey?: keyof StoreData;
    formatValue?: (store: StoreData) => string; // Kept for compatibility but unused in chart for now
    className?: string;
}) {
    const totalValue = stores.reduce((acc, curr) => acc + (Number(curr[dataKey]) || 0), 0);
    const formattedTotal = new Intl.NumberFormat("en-US", {
        style: dataKey === "revenue" ? "currency" : "decimal",
        currency: "UGX",
        minimumFractionDigits: 0,
    }).format(totalValue);

    const chartConfig = {
        [dataKey]: {
            label: dataKey === "revenue" ? "Revenue" : "Value",
            color: "hsl(var(--primary))",
        },
    } satisfies ChartConfig;

    return (
        <Card className={cn("w-full border-border/70 shadow-sm", className)}>
            <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <div className="text-2xl font-bold">{formattedTotal}</div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[260px] w-full md:h-[340px]">
                    <BarChart
                        accessibilityLayer
                        data={stores.map((s) => ({
                            ...s,
                            storeName: s.storeName ?? "—",
                        }))}
                        layout="vertical"
                        margin={{
                            left: 0,
                            right: 32,
                            top: 16,
                            bottom: 0,
                        }}
                        barSize={18}
                        barGap={12}
                        barCategoryGap={24}
                    >
                        <XAxis type="number" hide />
                        <YAxis dataKey="storeName" type="category" hide />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar
                            dataKey={dataKey as string}
                            radius={10}
                            fill="hsl(var(--primary))"
                            fillOpacity={0.85}
                            stroke="hsl(var(--primary))"
                            strokeWidth={1}
                        >
                            <LabelList dataKey="storeName" content={<NameLabel />} />
                            <LabelList
                                dataKey={dataKey as string}
                                position="right"
                                offset={8}
                                className="fill-muted-foreground"
                                fontSize={12}
                                formatter={(val: unknown) =>
                                    typeof val === "number" ? val.toLocaleString() : ""
                                }
                            />
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
