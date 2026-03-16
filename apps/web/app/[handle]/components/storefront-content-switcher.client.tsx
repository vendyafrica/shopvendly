"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@shopvendly/ui/components/tabs";

import { ProductGrid } from "./product-grid";
import { ProductGridSkeleton } from "./skeletons";

type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  hasSale?: boolean;
  currency: string;
  image: string | null;
  contentType?: string | null;
  averageRating?: number | null;
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
  activeSection?: string;
  hasSaleTab?: boolean;
  initialQuery?: string;
  products: StorefrontProduct[];
}

export function StorefrontContentSwitcher({
  handle = "",
  collections = [],
  activeCollectionSlug,
  activeSection,
  hasSaleTab = false,
  initialQuery,
  products,
}: StorefrontContentSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [displayProducts, setDisplayProducts] = useState(products);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [, startTransition] = useTransition();

  const query = useMemo(() => {
    const currentQuery = searchParams.get("q");
    return currentQuery ?? initialQuery ?? "";
  }, [initialQuery, searchParams]);

  useEffect(() => {
    setDisplayProducts(products);
  }, [products]);

  const currentSection = searchParams.get("section") ?? activeSection;
  const currentCollectionSlug = searchParams.get("collection") ?? activeCollectionSlug;

  const tabValue = currentSection === "new-arrivals"
    ? "section:new-arrivals"
    : currentSection === "sale"
    ? "section:sale"
    : currentCollectionSlug
    ? `collection:${currentCollectionSlug}`
    : "all";

  const updateRouteAndProducts = async (nextCollectionSlug?: string, nextSection?: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (nextCollectionSlug) {
      nextParams.set("collection", nextCollectionSlug);
    } else {
      nextParams.delete("collection");
    }

    if (nextSection) {
      nextParams.set("section", nextSection);
    } else {
      nextParams.delete("section");
    }

    const nextQueryString = nextParams.toString();
    const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });

    setIsLoadingProducts(true);

    try {
      const productUrl = new URL(`/api/storefront/${handle}/products`, window.location.origin);
      if (query) productUrl.searchParams.set("q", query);
      if (nextCollectionSlug) productUrl.searchParams.set("collection", nextCollectionSlug);
      if (nextSection) productUrl.searchParams.set("section", nextSection);

      const response = await fetch(productUrl.toString(), { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const nextProducts = (await response.json()) as StorefrontProduct[];
      setDisplayProducts(nextProducts);
    } catch (error) {
      console.error("Failed to refresh storefront products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  return (
    <>
      <section className="relative z-10 -mt-8 rounded-t-[28px] bg-background pt-8 shadow-[0_-1px_0_rgba(255,255,255,0.35)] sm:-mt-10 sm:pt-10 lg:-mt-12 lg:pt-12">
        <nav
          id="storefront-categories-rail"
          className="w-full"
        >
          <div className="w-full px-4 md:px-6">
            <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
              <Tabs
                value={tabValue}
                className="mx-auto w-max"
                onValueChange={(value) => {
                  if (value === "all") {
                    void updateRouteAndProducts();
                    return;
                  }

                  if (value === "section:new-arrivals") {
                    void updateRouteAndProducts(undefined, "new-arrivals");
                    return;
                  }

                  if (value === "section:sale") {
                    void updateRouteAndProducts(undefined, "sale");
                    return;
                  }

                  if (value.startsWith("collection:")) {
                    const slug = value.replace("collection:", "");
                    void updateRouteAndProducts(slug);
                  }
                }}
              >
                <TabsList
                  variant="line"
                  className="mx-auto flex min-w-max items-center justify-center gap-6 border-0 bg-transparent p-0 text-center"
                >
                  <TabsTrigger
                    value="all"
                    className="h-auto flex-none rounded-none border-0 px-0 py-2 text-sm font-medium text-foreground/45 hover:text-foreground/70 data-active:bg-transparent! data-active:text-foreground! data-active:shadow-none after:bottom-0"
                  >
                    All Products
                  </TabsTrigger>

                  <TabsTrigger
                    value="section:new-arrivals"
                    className="h-auto flex-none rounded-none border-0 px-0 py-2 text-sm font-medium text-foreground/45 hover:text-foreground/70 data-active:bg-transparent! data-active:text-foreground! data-active:shadow-none after:bottom-0"
                  >
                    New Arrivals
                  </TabsTrigger>

                  {hasSaleTab ? (
                    <TabsTrigger
                      value="section:sale"
                      className="h-auto flex-none rounded-none border-0 px-0 py-2 text-sm font-medium text-foreground/45 hover:text-foreground/70 data-active:bg-transparent! data-active:text-foreground! data-active:shadow-none after:bottom-0"
                    >
                      On Sale
                    </TabsTrigger>
                  ) : null}

                  {collections.map((collection) => (
                    <TabsTrigger
                      key={collection.id}
                      value={`collection:${collection.slug}`}
                      className="h-auto max-w-[160px] flex-none rounded-none border-0 px-0 py-2 text-sm font-medium text-foreground/45 hover:text-foreground/70 data-active:bg-transparent! data-active:text-foreground! data-active:shadow-none after:bottom-0"
                    >
                      {collection.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </nav>
      </section>

      <div id="storefront-main-content" className="w-full pt-6 sm:pt-8">
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="my-8">
            {isLoadingProducts ? <ProductGridSkeleton /> : <ProductGrid products={displayProducts} />}
          </div>
        </div>
        <div className="my-20" />
      </div>
    </>
  );
}