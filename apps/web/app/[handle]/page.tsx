import { StorefrontContentSwitcher } from "./components/storefront-content-switcher.client";
import { StorefrontFooter } from "./components/footer";
import { Hero } from "./components/hero";
import { ProductGrid } from "./components/product-grid";
import { StorefrontViewTracker } from "./components/StorefrontViewTracker";
import { OneTapLogin } from "@/features/marketplace/components/one-tap-login";
import { Suspense } from "react";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";

type StorefrontStore = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl?: string | null;
  heroMedia?: string[];
  categories?: string[];
};

type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  hasSale?: boolean;
  discountPercent?: number | null;
  currency: string;
  image: string | null;
  contentType?: string | null;
};

type StorefrontCollection = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
};

const getApiBaseUrl = async () => {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const forwardedProto = headerList.get("x-forwarded-proto");
  const isDev = process.env.NODE_ENV === "development";
  const isLocalHost = host ? /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host) : false;
  const proto = forwardedProto || (isDev || isLocalHost ? "http" : "https");

  if (host) return `${proto}://${host}`;

  const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.WEB_URL;
  if (fallbackUrl) return fallbackUrl.replace(/\/$/, "");

  return isDev ? "http://localhost:3000" : "https://shopvendly.store";
};

interface StorefrontPageProps {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const capitalizeStoreName = (name?: string | null) => {
  if (!name) return "Store";
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { handle } = await params;
  const baseUrl = await getApiBaseUrl();
  const storeRes = await fetch(`${baseUrl}/api/storefront/${handle}`, {
    next: { revalidate: 60, tags: [`storefront:store:${handle}`] }
  });
  const store = storeRes.ok ? ((await storeRes.json()) as StorefrontStore) : null;

  if (!store) {
    return {
      title: "Store not found | ShopVendly",
      description: "Browse independent sellers on ShopVendly.",
      robots: { index: false, follow: false },
    };
  }

  const capitalizedName = capitalizeStoreName(store.name);
  const title = `${capitalizedName} | ${store.description ?? "Shop on ShopVendly"}`;
  const description =
    store.description ||
    `Shop ${capitalizedName} with trusted payments and delivery on ShopVendly.`;
  const ogImage = store.heroMedia?.[0] || store.logoUrl || "/og-image.png";
  const iconUrl = store.logoUrl || ogImage;

  return {
    title,
    description,
    alternates: { canonical: `/${store.slug}` },
    icons: {
      icon: [{ url: iconUrl }],
      shortcut: [{ url: iconUrl }],
    },
    openGraph: {
      title,
      description,
      url: `/${store.slug}`,
      siteName: "ShopVendly",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function StorefrontHomePage({ params, searchParams }: StorefrontPageProps) {
  const { handle } = await params;
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.q;
  const collection = resolvedSearchParams?.collection;
  const query = Array.isArray(search) ? search[0] : search;
  const activeCollectionSlug = Array.isArray(collection) ? collection[0] : collection;

  const baseUrl = await getApiBaseUrl();

  const storeRes = await fetch(`${baseUrl}/api/storefront/${handle}`, {
    next: { revalidate: 60, tags: [`storefront:store:${handle}`] }
  });
  const store = storeRes.ok ? ((await storeRes.json()) as StorefrontStore) : null;
  if (!store) notFound();

  const productUrl = new URL(`${baseUrl}/api/storefront/${handle}/products`);
  if (query) productUrl.searchParams.set("q", query);
  if (activeCollectionSlug) productUrl.searchParams.set("collection", activeCollectionSlug);
  const productsRes = await fetch(productUrl.toString(), {
    next: { revalidate: 30, tags: [`storefront:store:${handle}:products`] }
  });

  const saleUrl = new URL(`${baseUrl}/api/storefront/${handle}/products`);
  saleUrl.searchParams.set("section", "sale");

  const newArrivalsUrl = new URL(`${baseUrl}/api/storefront/${handle}/products`);
  newArrivalsUrl.searchParams.set("section", "new-arrivals");

  const [saleResult, newArrivalsResult] = await Promise.allSettled([
    fetch(saleUrl.toString(), {
      next: { revalidate: 30, tags: [`storefront:store:${handle}:products:sale`] }
    }),
    fetch(newArrivalsUrl.toString(), {
      next: { revalidate: 30, tags: [`storefront:store:${handle}:products:new-arrivals`] }
    })
  ]);

  const products = productsRes.ok
    ? ((await productsRes.json()) as StorefrontProduct[])
    : [];

  const saleProducts = saleResult.status === "fulfilled" && saleResult.value.ok
    ? ((await saleResult.value.json()) as StorefrontProduct[])
    : [];

  const newArrivalProducts = newArrivalsResult.status === "fulfilled" && newArrivalsResult.value.ok
    ? ((await newArrivalsResult.value.json()) as StorefrontProduct[])
    : [];

  const collectionsRes = await fetch(`${baseUrl}/api/storefront/${handle}/collections`, {
    next: { revalidate: 60, tags: [`storefront:store:${handle}:collections`] },
  });
  const collections = collectionsRes.ok
    ? ((await collectionsRes.json()) as StorefrontCollection[])
    : [];

  const showHomepageSections = !query && !activeCollectionSlug;

  return (
    <div className="min-h-screen">
      {/* Async trackers — fire and forget, don't block render */}
      <Suspense fallback={null}>
        <StorefrontViewTracker storeSlug={handle} />
      </Suspense>
      <Suspense fallback={null}>
        <OneTapLogin storeSlug={handle} />
      </Suspense>

      <Hero store={store} />

      <StorefrontContentSwitcher
        handle={handle}
        collections={collections}
        activeCollectionSlug={activeCollectionSlug}
        initialQuery={query}
        products={products}
      />

      {showHomepageSections && newArrivalProducts.length > 0 ? (
        <section className="pb-6 pt-2 sm:pb-8">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 lg:px-10 xl:px-12">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">New Arrivals</h2>
                <p className="text-sm text-neutral-500">Fresh picks recently added to this store.</p>
              </div>
            </div>
          </div>
          <ProductGrid products={newArrivalProducts} />
        </section>
      ) : null}

      {showHomepageSections && saleProducts.length > 0 ? (
        <section className="pb-10 pt-2 sm:pb-12">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 lg:px-10 xl:px-12">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">Sale</h2>
                <p className="text-sm text-neutral-500">Reduced-price products currently on offer.</p>
              </div>
            </div>
          </div>
          <ProductGrid products={saleProducts} />
        </section>
      ) : null}

      <StorefrontFooter store={store} />
    </div>
  );
}