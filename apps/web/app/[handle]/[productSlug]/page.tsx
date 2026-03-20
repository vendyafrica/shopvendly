import { ProductDetails } from "@/app/[handle]/components/product-details";
import { ProductGridReveal } from "@/app/[handle]/components/product-grid-reveal";
import { StorefrontFooter } from "@/app/[handle]/components/footer";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { storefrontService } from "@/modules/storefront/data";

const siteUrl = process.env.WEB_URL || "https://shopvendly.store";

interface PageProps {
  params: Promise<{
    handle: string;
    productSlug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle, productSlug } = await params;
  const store = await storefrontService.findStoreBySlug(handle);
  if (!store) {
    return {
      title: "Store not found | ShopVendly",
      description: "Browse independent sellers on ShopVendly.",
      robots: { index: false, follow: false },
    };
  }

  const product = await storefrontService.getStoreProductBySlug(store.id, productSlug);

  if (!product) {
    return {
      title: "Product not found | ShopVendly",
      description: "Browse independent sellers on ShopVendly.",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `/${store.slug}/${product.slug}`;
  const ogImage = product.image || store.logoUrl || "/og-image.png";

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
  const { handle, productSlug } = await params;

  const store = await storefrontService.findStoreBySlug(handle);
  if (!store) notFound();

  const [product, products] = await Promise.all([
    storefrontService.getStoreProductBySlug(store.id, productSlug),
    storefrontService.getStoreProducts(store.id)
  ]);

  if (!product) {
    notFound();
  }

  const productWithStore = {
    ...product,
    store: {
      id: store.id,
      name: store.name,
      slug: store.slug,
      logoUrl: store.logoUrl,
    },
  };

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
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-26 pb-8 md:pt-30 md:pb-12">
            <div className="h-[70vh] rounded-md bg-neutral-100 animate-pulse" />
          </div>
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-26 pb-8 md:pt-30 md:pb-12">
          <ProductDetails product={productWithStore} storeCategories={storeCategories} storePolicy={store.storePolicy ?? null} />
        </div>
      </Suspense>
      <ProductGridReveal products={products.map((p) => ({ ...p, rating: p.averageRating ?? 0 }))} />
      <StorefrontFooter store={store} />
    </main>
  );
}