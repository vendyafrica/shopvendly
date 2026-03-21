import { ProductPageUI } from "@/app/[handle]/components/product-page-ui";
import { storefrontService } from "@/modules/storefront";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

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
    <ProductPageUI
      productWithStore={productWithStore}
      products={products}
      store={store}
      storeCategories={storeCategories}
      productJsonLd={productJsonLd}
      breadcrumbJsonLd={breadcrumbJsonLd}
    />
  );
}
