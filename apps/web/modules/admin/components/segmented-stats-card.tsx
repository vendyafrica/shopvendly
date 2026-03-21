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
        <div className="grid grid-cols-2 gap-4 divide-y divide-border/50 p-4 md:grid-cols-4 md:gap-0 md:divide-y-0 md:divide-x md:p-8">
          {segments.map((s, idx) => {
            const toneClass =
              s.changeTone === "positive"
                ? "text-emerald-500 font-semibold"
                : s.changeTone === "negative"
                  ? "text-rose-500 font-semibold"
                  : "text-muted-foreground";

            return (
              <div
                key={idx}
                className="bg-card px-4 py-4 md:px-8 md:py-6"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">{s.label}</div>
                <div className="mt-1.5 text-2xl font-medium tracking-tight text-foreground md:text-3xl">{s.value}</div>
                <div className={cn("mt-1.5 flex items-center gap-1 text-xs", toneClass)}>{s.changeLabel}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
