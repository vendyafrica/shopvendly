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
