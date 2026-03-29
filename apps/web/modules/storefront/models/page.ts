import type { StoreDetails } from "./store";

export type StorefrontJsonLd = Record<string, unknown>;

export type ProductPageStore = StoreDetails;

export type ProductPageProduct = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  currency: string;
  images: string[];
  mediaItems?: { url: string; contentType?: string | null }[];
  variants?: {
    enabled: boolean;
    options: { type: string; label: string; values: string[]; preset?: string | null }[];
  } | null;
  image: string | null;
  averageRating?: number;
  ratingCount?: number;
  store: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
};

export type ProductPageProps = {
  productWithStore: ProductPageProduct;
  products: ProductPageProduct[];
  store: StoreDetails;
  storeCategories: string[];
  productJsonLd: StorefrontJsonLd;
  breadcrumbJsonLd: StorefrontJsonLd;
};
