import { ProductDetails } from "../components/product-details";
import { ProductGridReveal } from "../components/product-grid-reveal";
import { StorefrontFooter } from "../components/footer";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";

const siteUrl = process.env.WEB_URL || "https://shopvendly.store";

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
  description?: string | null;
  price: number;
  currency: string;
  images: string[];
  mediaItems?: { url: string; contentType?: string | null }[];
  rating?: number;
  ratingCount?: number;
  userRating?: number | null;
  store: {
    id: string;
    name: string;
    slug: string;
  };
};

type StorefrontProductListItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  contentType?: string | null;
  rating?: number;
  ratingCount?: number;
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
  params: Promise<{
    s: string;
    productSlug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { s, productSlug } = await params;
  const baseUrl = await getApiBaseUrl();
  const storeRes = await fetch(`${baseUrl}/api/storefront/${s}`, { next: { revalidate: 60 } });
  const store = storeRes.ok ? (await storeRes.json()) as StorefrontStore : null;
  const productRes = await fetch(`${baseUrl}/api/storefront/${s}/products/${productSlug}`, { next: { revalidate: 60 } });
  const product = productRes.ok ? (await productRes.json()) as StorefrontProduct : null;

  if (!store || !product) {
    return {
      title: "Product not found | ShopVendly",
      description: "Browse independent sellers on ShopVendly.",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `/${store.slug}/${product.slug}`;
  const ogImage = product.images?.[0] || store.logoUrl || "/og-image.png";

  const title = `${product.name} by ${store.name} | ShopVendly`;
  const description = product.description || `Shop ${product.name} from ${store.name} with trusted payments and delivery on ShopVendly.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
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

export default async function ProductPage({ params }: PageProps) {
  const { s, productSlug } = await params;
  const baseUrl = await getApiBaseUrl();
  const storeRes = await fetch(`${baseUrl}/api/storefront/${s}`, { next: { revalidate: 60 } });
  const store = storeRes.ok ? (await storeRes.json()) as StorefrontStore : null;
  const productRes = await fetch(`${baseUrl}/api/storefront/${s}/products/${productSlug}`, { next: { revalidate: 60 } });
  const product = productRes.ok ? (await productRes.json()) as StorefrontProduct : null;
  const productsRes = await fetch(`${baseUrl}/api/storefront/${s}/products`, { next: { revalidate: 30 } });
  const products = productsRes.ok ? (await productsRes.json()) as StorefrontProductListItem[] : [];

  if (!store || !product) {
    notFound();
  }

  const canonicalPath = `/${store.slug}/${product.slug}`;
  const storeCategories = store.categories ?? [];

  const productImage = product.images?.[0] || store.logoUrl || "";
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images?.length ? product.images : productImage ? [productImage] : undefined,
    brand: {
      "@type": "Brand",
      name: store.name,
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}${canonicalPath}`,
      priceCurrency: product.currency,
      price: product.price,
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Marketplace",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: store.name,
        item: `${siteUrl}/${store.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${siteUrl}${canonicalPath}`,
      },
    ],
  };

  return (
    <main className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-26 pb-8 md:pt-30 md:pb-12">
        <ProductDetails product={product} storeCategories={storeCategories} />
      </div>
      <ProductGridReveal products={products.map((p) => ({ ...p, rating: p.rating ?? 0 }))} />
      <StorefrontFooter store={store} />
    </main>
  );
}
