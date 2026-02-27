"use client";

import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ProductCard } from "../../[s]/components/product-card";

export default function RecentlyViewed() {
  const { recentItems, isLoaded } = useRecentlyViewed();

  if (!isLoaded) return null; // Avoid hydration mismatch or flash
  if (recentItems.length === 0) return null;

  const formatPrice = (amount: number | undefined, currency: string | undefined) => {
    if (amount === undefined || amount === null || Number.isNaN(amount)) return "—";
    const c = currency || "";
    const showDecimals = c === "USD";
    return `${c} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    })}`.trim();
  };

  return (
    <div className="py-8">
      <h2 className="text-xl font-semibold mb-6">Recently viewed</h2>

      <div className="columns-2 md:columns-4 gap-3 md:gap-4 [column-fill:balance]">
        {recentItems.map((item, index) => (
          <ProductCard
            key={item.id}
            index={index}
            title={item.name}
            id={item.id}
            slug={item.slug}
            storeSlug={item.store.slug}
            price={formatPrice(item.price, item.currency)}
            image={item.image}
            contentType={item.contentType}
          />
        ))}
      </div>
    </div>
  );
}
