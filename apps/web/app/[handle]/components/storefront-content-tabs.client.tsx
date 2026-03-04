"use client";

import { StorefrontContentSwitcher } from "./storefront-content-switcher.client";

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

interface StorefrontContentTabsClientProps {
  products: StorefrontProduct[];
  inspirationVideos: TikTokVideo[];
}

export function StorefrontContentTabsClient({
  products,
  inspirationVideos,
}: StorefrontContentTabsClientProps) {
  return (
    <StorefrontContentSwitcher
      products={products}
      inspirationVideos={inspirationVideos}
      showInspiration={inspirationVideos.length > 0}
    />
  );
}
