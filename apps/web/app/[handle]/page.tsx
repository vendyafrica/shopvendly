import { StorefrontUI } from "./components/storefront-ui";
import { storefrontService } from "@/modules/storefront";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface StorefrontPageProps {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { handle } = await params;
  const store = await storefrontService.findStoreBySlug(handle);

  if (!store) {
    return {
      title: "Store not found | ShopVendly",
      description: "Browse independent sellers on ShopVendly.",
      robots: { index: false, follow: false },
    };
  }

  const capitalizedName = store.name.charAt(0).toUpperCase() + store.name.slice(1);
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

  const store = await storefrontService.findStoreBySlug(handle);

  if (!store) notFound();

  const [products, saleProducts, collections] = await Promise.all([
    storefrontService.getStoreProductsWithFilters(store.id, { q: query, collection: activeCollectionSlug, section: activeSection }),
    storefrontService.getStoreProductsWithFilters(store.id, { section: "sale" }),
    storefrontService.getStoreCollections(store.id),
  ]);

  const hasSaleTab = saleProducts.length > 0;

  return (
    <StorefrontUI
      handle={handle}
      store={store as any}
      products={products as any}
      collections={collections as any}
      activeCollectionSlug={activeCollectionSlug}
      activeSection={activeSection}
      hasSaleTab={hasSaleTab}
      initialQuery={query}
    />
  );
}
