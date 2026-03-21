"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";
import { Info } from "lucide-react";

export type SalesBreakdown = {
  grossSales: number;
  discounts: number;
  netSales: number;
  totalSales: number;
  revenue: number;
  balance: number;
  paidOut: number;
};

export function TotalSalesBreakdownCard({
  breakdown,
  className,
}: {
  breakdown: SalesBreakdown;
  className?: string;
}) {
  const formatCurrency = (value: number) => {
    return `USh ${new Intl.NumberFormat("en-UG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)}`;
  };

  const items = [
    { label: "Gross sales", value: breakdown.grossSales, highlighted: false },
    { label: "Discounts", value: breakdown.discounts, highlighted: false },
    { label: "Net sales", value: breakdown.netSales, highlighted: false },
    { label: "Total sales", value: breakdown.totalSales, highlighted: false },
    { label: "Revenue", value: breakdown.revenue, highlighted: false },
    { label: "Balance", value: breakdown.balance, highlighted: false },
    { label: "Paid out", value: breakdown.paidOut, highlighted: true },
  ];

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Total sales breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="space-y-1">
          {items.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors",
                item.highlighted ? "bg-muted/40" : ""
              )}
            >
              <span className={cn("text-[13px] font-medium text-primary hover:underline cursor-pointer")}>
                {item.label}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold">{formatCurrency(item.value)}</span>
                <span className="text-xs text-muted-foreground/50 font-light">—</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
