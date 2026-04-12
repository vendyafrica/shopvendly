export type StorefrontRouteParams = {
  params: Promise<{ slug: string }>;
};

export type StorefrontProductRouteParams = {
  params: Promise<{ slug: string; productSlug: string }>;
};

export type StorefrontTrackEventInput = {
  eventType: string;
  productId?: string;
  orderId?: string;
  quantity?: number;
  amount?: number;
  currency?: string;
  meta?: Record<string, unknown>;
};

export type StorefrontTrackRequestBody = {
  sessionId: string;
  userId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: string;
  country?: string;
  events: StorefrontTrackEventInput[];
};

export type StorefrontProductMedia = {
  media?: {
    blobUrl?: string | null;
    blobPathname?: string | null;
    contentType?: string | null;
  } | null;
};

export type StorefrontProduct = {
  id: string;
  slug: string | null;
  productName: string;
  description: string | null;
  priceAmount: unknown;
  originalPriceAmount?: unknown;
  currency: string;
  createdAt?: string | Date;
  quantity?: number | null;
  variants?: {
    enabled?: boolean;
    options?: Array<{ type?: string; label?: string; values?: string[]; preset?: string | null }>;
  } | null;
  media?: StorefrontProductMedia[];
  rating?: number;
  ratingCount?: number;
};

export type StorefrontProductVariantSummary = {
  hasColors: boolean;
  hasSizes: boolean;
};

export type StorefrontStoreRouteParams = {
  params: Promise<{ slug: string }>;
};

export type StorefrontProductsRouteParams = {
  params: Promise<{ slug: string }>;
};

export type StorefrontOrderRouteParams = {
  params: Promise<{ slug: string }>;
};

export type StoreCollectionRouteParams = {
  params: Promise<{ collectionId: string }>;
};

export type StorefrontCategory = {
  slug: string;
  name: string;
  image: string | null;
};
