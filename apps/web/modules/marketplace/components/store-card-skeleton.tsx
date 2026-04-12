"use client";

import { StoreImageSkeleton, StoreInfoSkeleton } from "@/shared/components/ui/skeleton-parts";

export function StoreCardSkeleton() {
  return (
    <div className="group">
      <StoreImageSkeleton />
      <StoreInfoSkeleton />
    </div>
  );
}
