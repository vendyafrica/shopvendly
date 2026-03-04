"use client";

import * as React from "react";
import { Categories } from "./categories";
import { ProductGrid } from "./product-grid";
import { InspirationGrid } from "./inspiration-grid";

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
  video_url?: string;
  embed_link?: string;
  share_url?: string;
};

type StorefrontView = "products" | "inspiration";

interface StorefrontContentSwitcherProps {
  products: StorefrontProduct[];
  inspirationVideos: TikTokVideo[];
  showInspiration: boolean;
}

export function StorefrontContentSwitcher({
  products,
  inspirationVideos,
  showInspiration,
}: StorefrontContentSwitcherProps) {
  const [activeView, setActiveView] = React.useState<StorefrontView>("products");

  React.useEffect(() => {
    if (!showInspiration && activeView === "inspiration") {
      setActiveView("products");
    }
  }, [showInspiration, activeView]);

  return (
    <>
      <div className="mt-5">
        <Categories
          activeView={activeView}
          onChangeView={setActiveView}
          showInspiration={showInspiration}
        />
      </div>

      <div id="storefront-main-content" className="w-full pt-3">
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="my-8">
            {activeView === "inspiration" && showInspiration ? (
              <InspirationGrid videos={inspirationVideos} />
            ) : (
              <ProductGrid products={products} />
            )}
          </div>
        </div>
        <div className="my-20" />
      </div>
    </>
  );
}
