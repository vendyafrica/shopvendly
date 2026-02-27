"use client";

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@shopvendly/ui/components/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export type RevenuePoint = {
    date: string;
    total: number;
};

export function revenue-area-chart-card({
    title,
    totalLabel,
    data,
    className,
}: {
    title: string;
    totalLabel: string;
    data: RevenuePoint[];
    className?: string;
}) {
    const chartConfig = {
        total: {
            label: "Revenue",
            color: "hsl(var(--primary))",
        },
    } satisfies ChartConfig;

    return (
        <Card className={cn("w-full border-border/70 shadow-sm", className)}>
            <CardHeader className="space-y-1 pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
                <div className="text-3xl font-bold text-foreground">{totalLabel}</div>
            </CardHeader>
            <CardContent className="px-3 pb-4 md:px-5">
                <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full md:h-[320px]">
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: 18,
                            right: 18,
                            top: 20,
                            bottom: 20,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            width={42}
                            tickMargin={10}
                            padding={{ top: 8, bottom: 8 }}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <defs>
                            <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="var(--foreground)"
                            strokeWidth={2}
                            fill="url(#fillRevenue)"
                            dot={false}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
