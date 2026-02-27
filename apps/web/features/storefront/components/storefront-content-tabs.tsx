"use client";

import { ProductGrid } from "./product-grid";
import { InspirationGrid } from "./inspiration-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shopvendly/ui/components/tabs";

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
    <Tabs defaultValue="products" className="w-full gap-6">
      <TabsList variant="line" className="w-full justify-start rounded-none p-0 border-b border-border">
        <TabsTrigger value="products" className="h-10 px-4 text-sm">
          All Products
        </TabsTrigger>
        <TabsTrigger value="inspiration" className="h-10 px-4 text-sm">
          Inspiration
        </TabsTrigger>
      </TabsList>

      <TabsContent value="products" className="pt-2">
        <ProductGrid products={products} />
      </TabsContent>

      <TabsContent value="inspiration" className="pt-2">
        <InspirationGrid videos={inspirationVideos} />
      </TabsContent>
    </Tabs>
  );
}
