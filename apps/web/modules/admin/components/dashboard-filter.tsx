"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shopvendly/ui/components/select";

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") || "monthly";

  const handleRangeChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Select value={currentRange} onValueChange={handleRangeChange}>
      <SelectTrigger className="w-[120px] bg-muted/50 border capitalize font-medium tracking-wider text-[10px]">
        <SelectValue placeholder="Select range" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="daily" className="font-medium tracking-wider text-[10px]">Daily</SelectItem>
        <SelectItem value="weekly" className="font-medium tracking-wider text-[10px]">Weekly</SelectItem>
        <SelectItem value="monthly" className="font-medium tracking-wider text-[10px]">Monthly</SelectItem>
      </SelectContent>
    </Select>
  );
}
