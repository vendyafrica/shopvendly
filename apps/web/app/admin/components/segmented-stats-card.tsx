import { type ReactNode } from "react";

import { Card, CardContent } from "@shopvendly/ui/components/card";
import { cn } from "@shopvendly/ui/lib/utils";

export type StatSegment = {
  label: string;
  value: ReactNode;
  changeLabel: string;
  changeTone?: "positive" | "negative" | "neutral";
};

export function SegmentedStatsCard({
  segments,
  className,
}: {
  segments: StatSegment[];
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-3 divide-y divide-border/70 p-3 md:grid-cols-4 md:gap-0 md:divide-y-0 md:divide-x md:p-5">
          {segments.map((s, idx) => {
            const toneClass =
              s.changeTone === "positive"
                ? "text-emerald-600"
                : s.changeTone === "negative"
                  ? "text-rose-600"
                  : "text-muted-foreground";

            return (
              <div
                key={idx}
                className="bg-card px-2 py-2 md:px-4 md:py-3"
              >
                <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
                <div className="mt-1 text-2xl font-semibold text-foreground">{s.value}</div>
                <div className={cn("mt-1 text-xs font-medium", toneClass)}>{s.changeLabel}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
