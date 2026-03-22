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

type VisitsTimeRange = "7d" | "30d";

function formatChartDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function VisitsAreaChartCard({
  title,
  totalLabel,
  data,
}: {
  title: string;
  totalLabel: string;
  data: VisitsPoint[];
}) {
  const [timeRange, setTimeRange] = useState<VisitsTimeRange>("30d");

  const filteredData = timeRange === "7d" ? data.slice(-7) : data;
  const maxValue = Math.max(0, ...filteredData.map((point) => point.visits));
  const yAxisMax = maxValue === 0 ? 5 : Math.max(5, Math.ceil(maxValue * 1.25));

  const chartConfig = {
    visits: {
      label: "Visits",
      color: "hsl(262 83% 58%)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="text-3xl font-bold text-foreground">{totalLabel}</div>
        </div>
        <Select
          value={timeRange}
          onValueChange={(value: VisitsTimeRange | null) => {
            if (value) setTimeRange(value);
          }}
        >
          <SelectTrigger className="w-[110px] rounded-md border-border sm:ml-auto h-12 px-4 bg-muted/20 text-sm font-medium" size="default">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-md p-1">
            <SelectItem className="py-1 px-3" value="30d">30d</SelectItem>
            <SelectItem className="py-1 px-3" value="7d">7d</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart
            data={filteredData}
            margin={{
              left: 8,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <defs>
              <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-visits)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-visits)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.08} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={formatChartDate}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={4}
              width={54}
              domain={[0, yAxisMax]}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Area
              dataKey="visits"
              type="monotone"
              fill="url(#fillVisits)"
              stroke="var(--color-visits)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
