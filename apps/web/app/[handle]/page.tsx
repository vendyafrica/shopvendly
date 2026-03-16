import { StorefrontContentSwitcher } from "./components/storefront-content-switcher.client";
import { StorefrontFooter } from "./components/footer";
import { Hero } from "./components/hero";
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
  currency: string;
  image: string | null;
  contentType?: string | null;
  averageRating?: number | null;
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
  const section = resolvedSearchParams?.section;
  const query = Array.isArray(search) ? search[0] : search;
  const activeCollectionSlug = Array.isArray(collection) ? collection[0] : collection;
  const activeSection = Array.isArray(section) ? section[0] : section;

  const baseUrl = await getApiBaseUrl();

  const productUrl = new URL(`${baseUrl}/api/storefront/${handle}/products`);
  if (query) productUrl.searchParams.set("q", query);
  if (activeCollectionSlug) productUrl.searchParams.set("collection", activeCollectionSlug);
  if (activeSection) productUrl.searchParams.set("section", activeSection);

  const saleUrl = new URL(`${baseUrl}/api/storefront/${handle}/products`);
  saleUrl.searchParams.set("section", "sale");

  const [storeRes, productsRes, saleResult, collectionsRes] = await Promise.all([
    fetch(`${baseUrl}/api/storefront/${handle}`, {
      ...(process.env.NODE_ENV === "development" ? { cache: "no-store" } : { next: { revalidate: 60, tags: [`storefront:store:${handle}`] } })
    }),
    fetch(productUrl.toString(), {
      ...(process.env.NODE_ENV === "development" ? { cache: "no-store" } : { next: { revalidate: 30, tags: [`storefront:store:${handle}:products`] } })
    }),
    fetch(saleUrl.toString(), {
      ...(process.env.NODE_ENV === "development" ? { cache: "no-store" } : { next: { revalidate: 30, tags: [`storefront:store:${handle}:products:sale`] } })
    }),
    fetch(`${baseUrl}/api/storefront/${handle}/collections`, {
      ...(process.env.NODE_ENV === "development" ? { cache: "no-store" } : { next: { revalidate: 60, tags: [`storefront:store:${handle}:collections`] } })
    }),
  ]);

  const store = storeRes.ok ? ((await storeRes.json()) as StorefrontStore) : null;
  if (!store) notFound();

  const products = productsRes.ok
    ? ((await productsRes.json()) as StorefrontProduct[])
    : [];

  const saleProducts = saleResult.ok
    ? ((await saleResult.json()) as StorefrontProduct[])
    : [];

  const collections = collectionsRes.ok
    ? ((await collectionsRes.json()) as StorefrontCollection[])
    : [];

  const hasSaleTab = saleProducts.length > 0;

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
        activeSection={activeSection}
        hasSaleTab={hasSaleTab}
        initialQuery={query}
        products={products}
      />

      <StorefrontFooter store={store} />
    </div>
  );
}