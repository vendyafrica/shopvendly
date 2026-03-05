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

type StoreCollection = {
  id: string;
  name: string;
  slug: string;
};

interface StorefrontContentTabsProps {
  handle?: string;
  collections?: StoreCollection[];
  activeCollectionSlug?: string;
  products: StorefrontProduct[];
  showInspirationTab: boolean;
  inspirationVideos: TikTokVideo[];
}

export function StorefrontContentTabs({
  handle,
  collections,
  activeCollectionSlug,
  products,
  showInspirationTab,
  inspirationVideos,
}: StorefrontContentTabsProps) {
  return (
    <StorefrontContentSwitcher
      handle={handle}
      collections={collections}
      activeCollectionSlug={activeCollectionSlug}
      products={products}
      showInspiration={showInspirationTab}
      inspirationVideos={inspirationVideos}
    />
  );
}
