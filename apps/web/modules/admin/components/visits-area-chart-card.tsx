"use client";

import { useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@shopvendly/ui/components/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shopvendly/ui/components/select";

export type VisitsPoint = {
  date: string;
  visits: number;
};

export function VisitsAreaChartCard({
  title,
  totalLabel,
  data,
}: {
  title: string;
  totalLabel: string;
  data: VisitsPoint[];
}) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("30d");

  const filteredData = timeRange === "7d" ? data.slice(-7) : data;

  const chartConfig = {
    visits: {
      label: "Visits",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="text-3xl font-bold text-foreground">{totalLabel}</div>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[120px] rounded-lg border-border sm:ml-auto h-8 bg-muted/20" size="sm">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart
            data={filteredData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value.slice(0, 6)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={3}
              domain={[0, "auto"]}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value;
              }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-visits)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-visits)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="visits"
              type="monotone"
              fill="url(#fillVisits)"
              stroke="var(--color-visits)"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
