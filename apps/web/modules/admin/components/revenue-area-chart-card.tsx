"use client";

import { useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@shopvendly/ui/components/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shopvendly/ui/components/select";
import { Info } from "lucide-react";

export type RevenuePoint = {
  date: string;
  total: number;
  prevTotal?: number;
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
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("30d");

  const filteredData = timeRange === "7d" ? data.slice(-7) : data;

  const chartConfig = {
    total: {
      label: "Current Period",
      color: "hsl(var(--primary))",
    },
    prevTotal: {
      label: "Previous Period",
      color: "hsl(var(--primary) / 0.3)",
    },
  } satisfies ChartConfig;

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-2 md:p-8 md:pb-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium border-b border-dotted border-muted-foreground/40 cursor-help flex items-center gap-2">
              {title}
            </CardTitle>
            <Info className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {totalLabel}
            <span className="text-muted-foreground font-normal ml-2">—</span>
          </div>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[100px] rounded-lg border-border sm:ml-auto h-8 bg-muted/20" size="sm">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            <SelectItem value="30d">30d</SelectItem>
            <SelectItem value="7d">7d</SelectItem>
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
            <CartesianGrid vertical={false} strokeOpacity={0.1} />
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
                return `UGX ${value}`;
              }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              content={({ payload }) => (
                <div className="flex items-center justify-center gap-6 mt-4">
                  {payload?.map((entry: any, index: number) => (
                    <div key={`item-${index}`} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {entry.value === "total" ? "Current Period" : "Previous Period"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillPrevRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-prevTotal)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="var(--color-prevTotal)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              dataKey="prevTotal"
              type="monotone"
              fill="url(#fillPrevRevenue)"
              stroke="var(--color-prevTotal)"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            <Area
              dataKey="total"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-total)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
