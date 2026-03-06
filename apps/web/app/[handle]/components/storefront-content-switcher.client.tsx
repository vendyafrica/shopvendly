"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@shopvendly/ui/components/tabs";

import { ProductGrid } from "./product-grid";

type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  contentType?: string | null;
};

type StoreCollection = {
  id: string;
  name: string;
  slug: string;
};

interface StorefrontContentSwitcherProps {
  handle?: string;
  collections?: StoreCollection[];
  activeCollectionSlug?: string;
  products: StorefrontProduct[];
}

export function StorefrontContentSwitcher({
  handle = "",
  collections = [],
  activeCollectionSlug,
  products,
}: StorefrontContentSwitcherProps) {
  const router = useRouter();

  const tabValue = activeCollectionSlug
    ? `collection:${activeCollectionSlug}`
    : "all";

  return (
    <>
      <div className="py-8 sm:py-12 mt-4 sm:mt-8 sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <nav
          id="storefront-categories-rail"
          className="w-full"
        >
          <div className="w-full">
            <div className="overflow-x-auto scrollbar-hide px-4 md:px-6">
              <Tabs
                value={tabValue}
                className="w-max mx-auto"
                onValueChange={(value) => {
                  if (value === "all") {
                    router.push(`/${handle}`);
                    return;
                  }

                  if (value.startsWith("collection:")) {
                    const slug = value.replace("collection:", "");
                    router.push(`/${handle}/categories/${slug}`);
                  }
                }}
              >
                <TabsList className="flex items-center gap-1.5 p-1.5 border border-border/50 bg-background rounded-md">
                  <TabsTrigger
                    value="all"
                    className="rounded-md py-4 text-[15px] font-medium w-[28vw] sm:w-[18vw] lg:w-[140px] shrink-0 truncate transition-all text-muted-foreground hover:text-foreground data-active:bg-muted/80! data-active:text-foreground!"
                  >
                    All Products
                  </TabsTrigger>

                  {collections.map((collection) => (
                    <TabsTrigger
                      key={collection.id}
                      value={`collection:${collection.slug}`}
                      className="rounded-full py-2.5 text-[15px] font-medium w-[28vw] sm:w-[18vw] lg:w-[140px] shrink-0 truncate transition-all text-muted-foreground hover:text-foreground data-active:bg-muted/80! data-active:text-foreground!"
                    >
                      {collection.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </nav>
      </div>

      <div id="storefront-main-content" className="w-full pt-3">
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="my-8">
            <ProductGrid products={products} />
          </div>
        </div>
        <div className="my-20" />
      </div>
    </>
  );
}