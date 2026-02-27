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
        <div className="text-2xl font-bold text-foreground md:text-3xl">{totalLabel}</div>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer config={chartConfig} className="block! aspect-auto! h-[220px] w-full md:h-[320px]">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 4,  // Reduce left margin for mobile, allow negative for tighter spacing
              right: 8,  // Reduce right margin
              top: 12,   // Reduce top margin
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fontSize: 11 }}  // Make ticks smaller on mobile
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={28}  // Reduce from 36 to 32 for mobile
              tickMargin={2}  // Reduce from 6 to 4
              padding={{ top: 8, bottom: 8 }}
              tick={{ fontSize: 10 }}  // Make Y-axis labels smaller
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value;
              }}
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
