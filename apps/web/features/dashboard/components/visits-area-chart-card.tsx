"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@shopvendly/ui/components/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export type VisitsPoint = {
  date: string;
  visits: number;
};

export function visits-area-chart-card({
  title,
  totalLabel,
  data,
}: {
  title: string;
  totalLabel: string;
  data: VisitsPoint[];
}) {
  const chartConfig = {
    visits: {
      label: "Visits",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="text-3xl font-bold text-foreground">{totalLabel}</div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full md:h-[340px]">
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
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={42} tickMargin={10} padding={{ top: 8, bottom: 8 }} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <defs>
              <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
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
