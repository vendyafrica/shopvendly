"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shopvendly/ui/components/tabs";
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
    <Tabs defaultValue="products" className="w-full gap-6">
      <TabsList variant="line" className="w-full justify-start rounded-none p-0">
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
