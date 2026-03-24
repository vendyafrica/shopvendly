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

export type ProductData = {
    product: string;
    sales: number;
    fill: string;
};

export function TopProductsBarChartCard({
    title,
    description,
    totalLabel,
    data,
    className,
}: {
    title: string;
    description?: string;
    totalLabel: string;
    data: ProductData[];
    className?: string;
}) {
    const chartConfig = {
        sales: {
            label: "Sales",
            color: "hsl(var(--primary))",
        },
    } satisfies ChartConfig;

    const chartData = [...data];
    while (chartData.length < 5) {
        chartData.push({
            product: `empty-${chartData.length}`,
            sales: 0,
            fill: "transparent",
        });
    }

    return (
        <Card className={cn("w-full border-border/70 shadow-sm", className)}>
            <CardHeader className="space-y-1 pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
                {description && (
                    <CardDescription className="text-xs">{description}</CardDescription>
                )}
                <div className="text-3xl font-bold text-foreground">{totalLabel}</div>
            </CardHeader>
            <CardContent className="px-3 pb-4 md:px-5">
                <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full md:h-[320px]">
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        layout="vertical"
                        margin={{
                            left: 0,
                            right: 16,
                            top: 8,
                            bottom: 8,
                        }}
                        barSize={32}
                    >
                        <YAxis
                            dataKey="product"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={120}
                            tick={(props) => {
                                const { x, y, payload } = props;
                                const isHidden = payload.value.toString().startsWith("empty-");
                                if (isHidden) return <g></g>;
                                return (
                                    <text x={x} y={y} dy={4} textAnchor="end" fill="currentColor" fontSize={12}>
                                        {payload.value}
                                    </text>
                                );
                            }}
                        />
                        <XAxis type="number" hide />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
