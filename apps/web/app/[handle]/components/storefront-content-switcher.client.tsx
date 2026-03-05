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
      <div className="mt-5">
        <nav
          id="storefront-categories-rail"
          className="border-px border-border bg-background sticky top-0 z-10"
        >
          <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="overflow-x-auto scrollbar-hide">
              <Tabs
                value={tabValue}
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
                <TabsList variant="line" className="flex min-w-full items-center justify-start gap-2 py-3">
                  <TabsTrigger value="all">All Products</TabsTrigger>

                  {collections.map((collection) => (
                    <TabsTrigger key={collection.id} value={`collection:${collection.slug}`}>
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