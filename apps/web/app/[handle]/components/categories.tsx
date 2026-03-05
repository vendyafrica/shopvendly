"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type StorefrontView = "products" | "inspiration";

type StoreCollection = {
  id: string;
  name: string;
  slug: string;
};

interface CategoriesProps {
  handle: string;
  collections: StoreCollection[];
  activeCollectionSlug?: string;
  activeView: StorefrontView;
  onChangeView: (view: StorefrontView) => void;
  showInspiration: boolean;
}

const getButtonClassName = (isActive: boolean) =>
  [
    "h-9 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-all duration-150",
    isActive
      ? "border-border bg-background text-foreground shadow-xs"
      : "border-transparent bg-muted/55 text-foreground/80 hover:bg-muted",
  ].join(" ");

export function Categories({
  handle,
  collections,
  activeCollectionSlug,
  activeView,
  onChangeView,
  showInspiration,
}: CategoriesProps) {
  const pathname = usePathname();

  const isAllProductsActive = pathname === `/${handle}` && !activeCollectionSlug;

  return (
    <nav
      id="storefront-categories-rail"
      className="border-px border-border bg-background sticky top-0 z-10"
    >
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="mx-auto flex w-max min-w-full items-center justify-center gap-1.5 sm:gap-2 py-3">
            <Link href={`/${handle}`} className={getButtonClassName(isAllProductsActive)}>
              All Products
            </Link>

            {collections.map((collection) => {
              const isActive = activeCollectionSlug === collection.slug;
              return (
                <Link
                  key={collection.id}
                  href={`/${handle}/categories/${collection.slug}`}
                  className={getButtonClassName(isActive)}
                >
                  {collection.name}
                </Link>
              );
            })}

            {showInspiration ? (
              <button
                type="button"
                onClick={() => onChangeView("inspiration")}
                className={getButtonClassName(activeView === "inspiration")}
              >
                Inspiration
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}