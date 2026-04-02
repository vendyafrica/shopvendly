import { StorefrontUI } from "@/modules/storefront/components";
import type { StoreDetails, StoreCollection, StorefrontProduct } from "@/modules/storefront/models/store";

export type StorefrontDefaultTemplateProps = {
  handle: string;
  store: StoreDetails;
  products: StorefrontProduct[];
  collections: StoreCollection[];
  activeCollectionSlug?: string;
  activeSection?: string;
  hasSaleTab: boolean;
  initialQuery?: string;
};

export function StorefrontDefaultTemplate(props: StorefrontDefaultTemplateProps) {
  return <StorefrontUI {...props} />;
}
