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

export function RevenueAreaChartCard({
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

    const chartData = [...data];

    // If there's only 1 point, we'll pad it with some dummy points from previous days
    // so the line chart doesn't just display a single dot in the middle.
    if (chartData.length === 1 && chartData[0]?.date) {
        const singleDate = new Date(chartData[0].date);
        for (let i = 1; i <= 4; i++) {
            const prevDate = new Date(singleDate);
            prevDate.setDate(singleDate.getDate() - i);
            chartData.unshift({
                date: prevDate.toISOString().split("T")[0] as string,
                total: 0,
            });
        }
    }

    return (
        <Card className={cn("w-full border-border/70 shadow-sm", className)}>
            <CardHeader className="space-y-1 pb-4 bg-muted/5 border-b border-border/40 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight">{title}</CardTitle>
                    </div>
                    <div className="text-2xl font-black text-primary tabular-nums tracking-tight">{totalLabel}</div>
                </div>
            </CardHeader>
            <CardContent className="px-3 pb-4 md:px-5">
                <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full md:h-[300px]">
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
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
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fill="url(#fillRevenue)"
                            fillOpacity={1}
                            activeDot={{
                                r: 6,
                                style: { fill: "#8b5cf6", opacity: 0.9 },
                            }}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
