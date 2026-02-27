import { StorefrontContentTabs } from "./components/storefront-content-tabs";
import { StorefrontFooter } from "./components/footer";
import { Hero } from "./components/hero";
import { StorefrontViewTracker } from "./components/StorefrontViewTracker";
import { OneTapLogin } from "@/app/(marketplace)/components/one-tap-login";
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
  params: Promise<{
    s: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { s } = await params;
  const baseUrl = await getApiBaseUrl();
  const storeRes = await fetch(`${baseUrl}/api/storefront/${s}`, { next: { revalidate: 60 } });
  const store = storeRes.ok ? (await storeRes.json()) as StorefrontStore : null;
  if (!store) {
    return {
      title: "Store not found | ShopVendly",
      description: "Browse independent sellers on ShopVendly.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${store.name} | Shop on ShopVendly`;
  const description = store.description || `Shop ${store.name} with trusted payments and delivery on ShopVendly.`;
  const ogImage = store.heroMedia?.[0] || store.logoUrl || "/og-image.png";

  return {
    title,
    description,
    alternates: {
      canonical: `/${store.slug}`,
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
  const { s } = await params;

  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.q;
  const query = Array.isArray(search) ? search[0] : search;

  const baseUrl = await getApiBaseUrl();
  const storeRes = await fetch(`${baseUrl}/api/storefront/${s}`, { next: { revalidate: 60 } });
  const store = storeRes.ok ? (await storeRes.json()) as StorefrontStore : null;

  if (!store) {
    notFound();
  }

  const productUrl = new URL(`${baseUrl}/api/storefront/${s}/products`);
  if (query) productUrl.searchParams.set("q", query);
  const productsRes = await fetch(productUrl.toString(), { next: { revalidate: 30 } });
  const products = productsRes.ok ? (await productsRes.json()) as StorefrontProduct[] : [];

  const inspirationRes = await fetch(`${baseUrl}/api/storefront/${s}/inspiration`, { next: { revalidate: 30 } });
  const inspirationPayload = inspirationRes.ok
    ? (await inspirationRes.json()) as { connected?: boolean; videos?: StorefrontTikTokVideo[] }
    : { connected: false, videos: [] };
  const showInspirationTab = Boolean(inspirationPayload?.connected);
  const inspirationVideos = Array.isArray(inspirationPayload?.videos) ? inspirationPayload.videos : [];

  return (
    <div className="min-h-screen">
      <StorefrontViewTracker storeSlug={s} />
      <OneTapLogin storeSlug={s} />
      <Hero store={store} />
      <div className="w-full">
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="my-8">
            <StorefrontContentTabs
              products={products}
              showInspirationTab={showInspirationTab}
              inspirationVideos={inspirationVideos}
            />
          </div>
        </div>
        <div className="my-20" />
      </div>
      <StorefrontFooter store={store} />
    </div>
  );
}