import type { ProductVariantsInput } from "@/modules/products/lib/product-models";

export type EditableField = "name" | "priceAmount" | "quantity";
export type DraftMap = Record<string, Partial<Record<EditableField, string>>>;

export type ProductEditingState = {
  id: string;
  productName: string;
  description?: string;
  priceAmount: number;
  originalPriceAmount?: number | null;
  currency: string;
  quantity: number;
  status: string;
  thumbnailUrl?: string;
  media?: { id?: string; blobUrl: string; contentType?: string; blobPathname?: string }[];
  collectionIds?: string[];
  variants?: ProductVariantsInput | null;
};
