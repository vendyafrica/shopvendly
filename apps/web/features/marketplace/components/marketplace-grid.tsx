"use client";
import { MarketplaceGridSkeleton } from "./marketplace-grid-skeleton";
import { StoreCard } from "./store-card";
import type { MarketplaceStore } from "@/types/marketplace";
interface MarketplaceGridProps {
  stores: MarketplaceStore[];
  loading?: boolean;
}
export function MarketplaceGrid({ stores, loading }: MarketplaceGridProps) {
  if (loading) {
    return <MarketplaceGridSkeleton />;
  }
  if (stores.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No stores found in this category.</p>
      </div>
    );
  }
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      
      <div className="grid grid-cols-2 gap-4 md:hidden">
        {stores.map((store) => (
          <StoreCard key={store.id} store={store} />
        ))}
      </div>

      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
