"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { cn } from "@shopvendly/ui/lib/utils";

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
  image?: string | null;
};

interface StorefrontContentSwitcherProps {
  handle?: string;
  collections?: StoreCollection[];
  initialQuery?: string;
  products: StorefrontProduct[];
}

export function StorefrontContentSwitcher({
  handle = "",
  collections = [],
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
    return searchParams.get("q") ?? initialQuery ?? "";
  }, [searchParams, initialQuery]);

  useEffect(() => {
    setDisplayProducts(products);
  }, [products]);

  const collectionCards = collections.filter(
    (c): c is StoreCollection & { image: string } =>
      typeof c.image === "string" && c.image.length > 0
  );

  const updateRouteAndProducts = async (nextCollectionSlug?: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    // Clear search query when switching categories/sections
    nextParams.delete("q");

    if (nextCollectionSlug) {
      nextParams.set("collection", nextCollectionSlug);
    } else {
      nextParams.delete("collection");
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

      const response = await fetch(productUrl.toString(), { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const result = await response.json();
      const nextProducts = (result.data ?? result) as StorefrontProduct[];
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
        <nav id="storefront-categories-rail" className="w-full px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Categories
              </p>
              <button
                type="button"
                onClick={() => void updateRouteAndProducts()}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                All Products
              </button>
            </div>

            {collectionCards.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-between sm:gap-4">
                {collectionCards.map((collection, index) => {
                  const isLastOdd = collectionCards.length % 2 === 1 && index === collectionCards.length - 1;
                  return (
                    <button
                      key={collection.id}
                      type="button"
                      onClick={() => void updateRouteAndProducts(collection.slug)}
                      className={cn(
                        "relative h-[120px] overflow-hidden rounded-2xl sm:h-[110px] sm:flex-1 sm:min-w-[200px] sm:max-w-[280px]",
                        isLastOdd && "col-span-2 mx-auto w-1/2 sm:col-span-1 sm:mx-0 sm:w-auto"
                      )}
                    >
                      <Image
                        src={collection.image}
                        alt={collection.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 280px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="text-sm font-medium text-white drop-shadow-md">
                          {collection.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>
      </section>

      <div id="storefront-main-content" className="w-full pt-6 sm:pt-8">
        <div className="px-4 sm:px-6 lg:px-8">
          {query && (
            <div className="mb-10 text-center">
              <h2 className="text-xl sm:text-2xl font-medium text-neutral-900 tracking-tight">
                Results for &ldquo;<span className="text-primary">{query}</span>&rdquo;
              </h2>
              <p className="mt-2 text-sm text-neutral-500 uppercase tracking-[0.15em]">
                {displayProducts.length} {displayProducts.length === 1 ? "product" : "products"} found
              </p>
            </div>
          )}
          <div className="my-8">
            {isLoadingProducts ? <ProductGridSkeleton /> : <ProductGrid products={displayProducts} />}
          </div>
        </div>
        <div className="my-20" />
      </div>
    </>
  );
}