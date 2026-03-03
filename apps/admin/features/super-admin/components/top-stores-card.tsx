"use client";

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@shopvendly/ui/components/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

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

    const chartData = stores.map((s) => ({
        ...s,
        storeName: s.storeName ?? "—",
    }));

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
                        data={chartData}
                        layout="vertical"
                        margin={{
                            left: 0,
                            right: 0,
                            top: 8,
                            bottom: 0,
                        }}
                        barSize={32}
                    >
                        <YAxis
                            dataKey="storeName"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={100}
                        />
                        <XAxis type="number" hide />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar
                            dataKey={dataKey as string}
                            layout="vertical"
                            radius={5}
                            fill="hsl(var(--primary))"
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
