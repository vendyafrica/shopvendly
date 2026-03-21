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
      <CardContent className="p-0">
        <ChartContainer config={chartConfig} className="block! aspect-auto! h-[220px] w-full md:h-[320px]">
          <AreaChart
            accessibilityLayer
            data={filteredData}
            margin={{
              left: 4,
              right: 8,
              top: 12,
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
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              width={28} 
              tickMargin={2} 
              padding={{ top: 8, bottom: 8 }} 
              tick={{ fontSize: 10 }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <defs>
              <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="natural"
              dataKey="visits"
              stroke="var(--foreground)"
              strokeWidth={2}
              fill="url(#fillVisits)"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
