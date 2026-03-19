"use client";

import { Card, CardContent } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`fill-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="natural"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill={`url(#fill-${title})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
