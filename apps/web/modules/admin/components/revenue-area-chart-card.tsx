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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {title}
            </CardTitle>
          </div>
          <div className="text-2xl font-semibold text-foreground md:text-2xl">
            {totalLabel}
          </div>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
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
              tickCount={5}
              domain={[0, (dataMax: number) => (dataMax === 0 ? 1000 : dataMax * 1.1)]}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                if (value === 0) return "UGX 0";
                return value.toString();
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
            <Area
              dataKey="prevTotal"
              type="monotone"
              fill="var(--color-prevTotal)"
              fillOpacity={0.1}
              stroke="var(--color-prevTotal)"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            <Area
              dataKey="total"
              type="monotone"
              fill="var(--color-total)"
              fillOpacity={0.2}
              stroke="var(--color-total)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
