import { Suspense } from "react";
import { ProductGrid } from "./product-grid";
import { StorefrontContentTabsClient } from "./storefront-content-tabs.client";

type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  contentType?: string | null;
};

type TikTokVideo = {
  id: string;
  title?: string;
  video_description?: string;
  duration?: number;
  cover_image_url?: string;
  embed_link?: string;
  share_url?: string;
};

interface StorefrontContentTabsProps {
  products: StorefrontProduct[];
  showInspirationTab: boolean;
  inspirationVideos: TikTokVideo[];
}

export function StorefrontContentTabs({
  products,
  showInspirationTab,
  inspirationVideos,
}: StorefrontContentTabsProps) {
  if (!showInspirationTab) {
    return (
      <>
        <h3 className="text-lg font-semibold my-8 text-foreground">All Products</h3>
        <ProductGrid products={products} />
      </>
    );
  }

  return (
    <Suspense
      fallback={
        <>
          <h3 className="text-lg font-semibold my-8 text-foreground">All Products</h3>
          <ProductGrid products={products} />
        </>
      }
    >
      <StorefrontContentTabsClient products={products} inspirationVideos={inspirationVideos} />
    </Suspense>
  );
}
