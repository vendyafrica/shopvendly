"use client";

import { Card, CardContent } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";
import { Area, AreaChart } from "recharts";
import { ChartContainer } from "@shopvendly/ui/components/chart";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnalyticsDownIcon, AnalyticsUpIcon } from "@hugeicons/core-free-icons";

export type SparklinePoint = {
  total: number;
};

export function SimpleLineChartCard({
  title,
  value,
  data,
  trend,
  trendTone,
  className,
}: {
  title: string;
  value: string;
  data: SparklinePoint[];
  trend?: string;
  trendTone?: "positive" | "negative" | "neutral";
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border bg-card flex flex-col justify-between", className)}>
      <CardContent className="p-4 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">{title}</p>
            <p className="text-3xl font-medium tracking-tight text-foreground">{value}</p>
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trendTone === "positive" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            )}>
              <HugeiconsIcon icon={trendTone === "positive" ? AnalyticsUpIcon : AnalyticsDownIcon} className="size-3.5" />
              {trend}
            </div>
          )}
        </div>

        <div className="mt-4 h-16 w-full opacity-60">
          <ChartContainer 
            config={{
              total: {
                label: title,
                color: "hsl(var(--primary))",
              },
            }}
            className="h-full w-full"
          >
            <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`fill-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-total)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                strokeWidth={2}
                fill={`url(#fill-${title})`}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
