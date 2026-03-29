export type StorefrontTrackEvent = {
  eventType: string;
  productId?: string;
  orderId?: string;
  quantity?: number;
  amount?: number;
  currency?: string;
  meta?: Record<string, unknown>;
};

export type StorefrontTrackPayload = {
  sessionId: string;
  userId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: string;
  country?: string;
  events: StorefrontTrackEvent[];
};

export type StorefrontTrackOptions = {
  userId?: string;
  includeHostTypeMeta?: boolean;
};
