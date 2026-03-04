import { StorefrontContentSwitcher } from "./components/storefront-content-switcher.client";
import { StorefrontFooter } from "./components/footer";
import { Hero } from "./components/hero";
import { StorefrontHeader } from "./components/header";
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
  claimable?: boolean;
  heroMedia?: string[];
  categories?: string[];
};

type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  contentType?: string | null;
};

type StorefrontTikTokVideo = {
  id: string;
  title?: string;
  video_description?: string;
  duration?: number;
  cover_image_url?: string;
  video_url?: string;
  embed_link?: string;
  share_url?: string;
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
  const storeRes = await fetch(`${baseUrl}/api/storefront/${handle}`, { next: { revalidate: 60 } });
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
  const query = Array.isArray(search) ? search[0] : search;

  const baseUrl = await getApiBaseUrl();

  const storeRes = await fetch(`${baseUrl}/api/storefront/${handle}`, { next: { revalidate: 60 } });
  const store = storeRes.ok ? ((await storeRes.json()) as StorefrontStore) : null;
  if (!store) notFound();

  const productUrl = new URL(`${baseUrl}/api/storefront/${handle}/products`);
  if (query) productUrl.searchParams.set("q", query);
  const productsRes = await fetch(productUrl.toString(), { next: { revalidate: 30 } });

  const products = productsRes.ok
    ? ((await productsRes.json()) as StorefrontProduct[])
    : [];

  // TikTok inspiration is temporarily disabled while we overhaul the experience.
  const showInspirationTab = false;
  const inspirationVideos: StorefrontTikTokVideo[] = [];

  return (
    <div className="min-h-screen">
      {/* Async trackers — fire and forget, don't block render */}
      <Suspense fallback={null}>
        <StorefrontViewTracker storeSlug={handle} />
      </Suspense>
      <Suspense fallback={null}>
        <OneTapLogin storeSlug={handle} />
      </Suspense>

      {/*
        StorefrontHeader is a Server Component that receives the already-fetched
        store object — no second fetch, no client waterfall.
      */}
      <StorefrontHeader
        initialStore={{
          name: store.name,
          slug: store.slug,
          logoUrl: store.logoUrl ?? undefined,
          claimable: Boolean(store.claimable),
        }}
      />

      <Hero store={store} />

      <StorefrontContentSwitcher
        products={products}
        showInspiration={showInspirationTab}
        inspirationVideos={inspirationVideos}
      />

      <StorefrontFooter store={store} />
    </div>
  );
}