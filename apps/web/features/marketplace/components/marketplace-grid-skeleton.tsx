"use client";

import { StoreCardSkeleton } from "./store-card-skeleton";

interface MarketplaceGridSkeletonProps {
  mobileCount?: number;
  desktopCount?: number;
}

export function MarketplaceGridSkeleton({
  mobileCount = 6,
  desktopCount = 10,
}: MarketplaceGridSkeletonProps = {}) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-2 gap-4 md:hidden">
        {Array.from({ length: mobileCount }).map((_, index) => (
          <StoreCardSkeleton key={index} />
        ))}
      </div>
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: desktopCount }).map((_, index) => (
              <StoreCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
