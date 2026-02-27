"use client";

import { StoreImageSkeleton, StoreInfoSkeleton } from "@/components/ui/skeleton-parts";

export function StoreCardSkeleton() {
  return (
    <div className="group">
      <StoreImageSkeleton />
      <StoreInfoSkeleton />
    </div>
  );
}
