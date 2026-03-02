"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@shopvendly/ui/components/badge";
import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@shopvendly/ui/components/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface Category {
  slug: string;
  name: string;
  image: string | null;
}

interface CategoriesProps {
  storeSlug?: string;
  initialCategories?: Category[];
}

// Quick filters for common product views
const QUICK_FILTERS = (slug: string) => [
  {
    slug: "all",
    name: "All Products",
    href: `/${slug}`,
    variant: "secondary" as BadgeVariant,
  },
  {
    slug: "new-arrivals",
    name: "New Arrivals",
    href: `/${slug}?filter=new-arrivals`,
    variant: "info" as BadgeVariant,        // violet
  },
  {
    slug: "on-sale",
    name: "On Sale",
    href: `/${slug}?filter=on-sale`,
    variant: "destructive" as BadgeVariant, // red
  },
];

const CATEGORY_VARIANTS: BadgeVariant[] = [
  "primary",
  "success",
  "info",
  "warning",
  "destructive",
];

const formatCategoryName = (name: string) =>
  name ? name.charAt(0).toUpperCase() + name.slice(1) : name;

const getBadgeClassName = (isActive: boolean) =>
  [
    "cursor-pointer rounded-full border h-9 px-4 text-sm font-medium transition-all duration-150",
    isActive
      ? "border-border bg-background text-foreground shadow-xs"
      : "border-transparent bg-muted/55 text-foreground/80 hover:bg-muted",
  ].join(" ");

export function Categories({ storeSlug, initialCategories = [] }: CategoriesProps) {
  const params = useParams();
  const derivedSlug =
    storeSlug ||
    (params?.handle as string) ||
    (params?.s as string) ||
    "";

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    if (initialCategories.length > 0 || !derivedSlug) {
      setLoading(false);
      return;
    }

    fetch(`/api/storefront/${derivedSlug}/categories`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [derivedSlug, initialCategories]);

  if (loading) {
    return (
      <nav className="bg-background">
        <div className="px-3 sm:px-4 lg:px-6 xl:px-8 py-4 overflow-x-auto scrollbar-hide">
          <div className="mx-auto flex w-max min-w-full items-center justify-center gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-24 bg-muted rounded-full animate-pulse shrink-0" />
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      id="storefront-categories-rail"
      className="border-px border-border bg-background sticky top-0 z-10"
    >
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="mx-auto flex w-max min-w-full items-center justify-center gap-1.5 sm:gap-2 py-3">
            {/* Quick filters */}
            {QUICK_FILTERS(derivedSlug).map((filter) => {
              const isActive = activeCategory === filter.slug;
              return (
                <Badge
                  key={filter.slug}
                  asChild={false}
                  variant={filter.variant}
                  appearance={isActive ? "outline" : "ghost"}
                  shape="circle"
                  size="lg"
                  className={getBadgeClassName(isActive)}
                >
                  <button
                    type="button"
                    onClick={() => setActiveCategory(filter.slug)}
                    className="whitespace-nowrap"
                  >
                    {filter.name}
                  </button>
                </Badge>
              );
            })}

            {/* Dynamic categories — separated by a subtle divider */}
            {categories.length > 0 && (
              <>
                <span className="h-5 w-px bg-border mx-1 shrink-0" aria-hidden />
                {categories.map((category, index) => {
                  const isActive = activeCategory === category.slug;
                  const variant = CATEGORY_VARIANTS[index % CATEGORY_VARIANTS.length];
                  return (
                    <Badge
                      key={category.slug}
                      asChild={false}
                      variant={variant}
                      appearance={isActive ? "outline" : "ghost"}
                      shape="circle"
                      size="lg"
                      className={getBadgeClassName(isActive)}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveCategory(category.slug)}
                        className="whitespace-nowrap"
                      >
                        {formatCategoryName(category.name)}
                      </button>
                    </Badge>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}