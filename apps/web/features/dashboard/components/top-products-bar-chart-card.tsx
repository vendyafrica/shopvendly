"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@shopvendly/ui/components/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

export type TopProductPoint = {
  product: string;
  sales: number;
  fill?: string;
};

const palette = [
  "#6f4ff6",
  "#7d5bfa",
  "#8c69fb",
  "#9a77fc",
  "#a885fd",
];

function ProductLabel({ x, y, value }: { x?: number; y?: number; value?: string }) {
  if (x == null || y == null || !value) return null;
  return (
    <text x={x} y={y - 10} fill="hsl(var(--foreground))" fontSize={12} fontWeight={600}>
      {value}
    </text>
  );
}

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
  data: TopProductPoint[];
  className?: string;
}) {
  const hasData = data.length > 0;
  const safeData = hasData ? data : [{ product: "—", sales: 0 }];
  const topProductsConfig = {
    sales: {
      label: "Sales",
    },
    product: {
      label: "Product",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <Card className={cn("md:col-span-3 lg:col-span-3", className)}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <div className="text-2xl font-bold">{totalLabel}</div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={topProductsConfig} className="block! aspect-auto! h-[260px] min-h-[220px] w-full md:h-[340px]">
          <BarChart
            accessibilityLayer
            data={safeData}
            layout="vertical"
            margin={{
              left: 0,
              right: 32,
              top: 16,
              bottom: 0,
            }}
            barSize={18}
            barGap={12}
            barCategoryGap={24}
          >
            <XAxis type="number" hide />
            <YAxis dataKey="product" type="category" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="sales"
              radius={10}
              fill="hsl(var(--primary))"
              fillOpacity={0.85}
              stroke="hsl(var(--primary))"
              strokeWidth={1}
            >
              {safeData.map((entry, idx) => (
                <Cell key={entry.product} fill={entry.fill || palette[idx % palette.length]} />
              ))}
              <LabelList
                dataKey="product"
                content={<ProductLabel />}
              />
              <LabelList
                dataKey="sales"
                position="right"
                offset={8}
                className="fill-muted-foreground"
                fontSize={12}
                formatter={(val: number | string) => (typeof val === "number" ? val.toLocaleString() : "")}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
        {!hasData ? (
          <div className="mt-2 text-xs text-muted-foreground">No product sales yet.</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
