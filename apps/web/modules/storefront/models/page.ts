import type { Product } from "./product";
import type { StoreDetails, StorefrontProduct } from "./store";

export type StorefrontJsonLd = Record<string, unknown>;

export type ProductPageStore = StoreDetails;

export type ProductPageProduct = Product & {
  image?: string | null;
  hasSale?: boolean;
  discountPercent?: number | null;
  contentType?: string | null;
  createdAt?: string | Date | null;
};

export type ProductPageProps = {
  productWithStore: ProductPageProduct;
  products: StorefrontProduct[];
  store: StoreDetails;
  storeCategories: string[];
  productJsonLd: StorefrontJsonLd;
  breadcrumbJsonLd: StorefrontJsonLd;
};
