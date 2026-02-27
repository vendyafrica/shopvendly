import { notFound } from "next/navigation";
import { ProductGrid } from "../../components/product-grid";
import { Categories } from "../../components/categories";
import type { Metadata } from "next";
import { headers } from "next/headers";

type StorefrontStore = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl?: string | null;
  heroMedia?: string[];
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

interface PageProps {
  params: Promise<{ s: string; categorySlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { s, categorySlug } = await params;
  const baseUrl = await getApiBaseUrl();
  const storeRes = await fetch(`${baseUrl}/api/storefront/${s}`, { next: { revalidate: 60 } });
  const store = storeRes.ok ? (await storeRes.json()) as StorefrontStore : null;

  if (!store) {
    return {
      title: "Store not found | Vendly",
      description: "Browse independent sellers on Vendly.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${categorySlug} | ${store.name} | Vendly`;
  const description = `Shop ${categorySlug} from ${store.name} on Vendly. Discover top picks, trusted sellers, and fast delivery.`;
  const ogImage = store.heroMedia?.[0] || store.logoUrl || "/og-image.png";

  return {
    title,
    description,
    alternates: {
      canonical: `/${store.slug}/categories/${categorySlug}`,
    },
    openGraph: {
      title,
      description,
      url: `/${store.slug}/categories/${categorySlug}`,
      siteName: "Vendly",
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

export default async function StorefrontCategoryPage({ params, searchParams }: PageProps) {
  const { s, categorySlug } = await params;
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.q;
  const query = Array.isArray(search) ? search[0] : search;

  const baseUrl = await getApiBaseUrl();
  const storeRes = await fetch(`${baseUrl}/api/storefront/${s}`, { next: { revalidate: 60 } });
  const store = storeRes.ok ? (await storeRes.json()) as StorefrontStore : null;
  if (!store) notFound();

  const productUrl = new URL(`${baseUrl}/api/storefront/${s}/products`);
  productUrl.searchParams.set("category", categorySlug);
  if (query) productUrl.searchParams.set("q", query);
  const productsRes = await fetch(productUrl.toString(), { next: { revalidate: 30 } });
  const products = productsRes.ok ? (await productsRes.json()) as StorefrontProduct[] : [];

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <Categories />
        <div className="px-8">
          <h3 className="text-lg font-semibold my-8 text-foreground">
            {categorySlug}
          </h3>
          <ProductGrid products={products} />
        </div>
        <div className="my-20" />
      </div>
    </div>
  );
}
