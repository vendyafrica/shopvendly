export type StorefrontTrackEvent = {
  eventType: string;
  productId?: string;
  orderId?: string;
  quantity?: number;
  amount?: number;
  currency?: string;
  meta?: Record<string, unknown>;
};

type TrackPayload = {
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

type StorefrontTrackOptions = {
  userId?: string;
  includeHostTypeMeta?: boolean;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function getOrCreateSessionId(storeSlug: string) {
  const key = `vendly_sf_session_${storeSlug}`;
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem(key, id);
  return id;
}

function getUtmParams() {
  try {
    const url = new URL(window.location.href);
    const utmSource = url.searchParams.get("utm_source") || undefined;
    const utmMedium = url.searchParams.get("utm_medium") || undefined;
    const utmCampaign = url.searchParams.get("utm_campaign") || undefined;
    return { utmSource, utmMedium, utmCampaign };
  } catch {
    return { utmSource: undefined, utmMedium: undefined, utmCampaign: undefined };
  }
}

function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mobi") || ua.includes("android")) return "mobile";
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
  return "desktop";
}

function getEntryHostType() {
  const hostname = window.location.hostname.toLowerCase();
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "shopvendly.store").toLowerCase();

  if (
    hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === rootDomain
    || hostname === `www.${rootDomain}`
  ) {
    return "root";
  }

  if (hostname.endsWith(`.${rootDomain}`)) {
    return "subdomain";
  }

  return "other";
}

export async function trackStorefrontEvents(
  storeSlug: string,
  events: StorefrontTrackEvent[],
  options?: StorefrontTrackOptions
) {
  if (!isBrowser()) return;
  if (!storeSlug) return;
  if (!events.length) return;

  const sessionId = getOrCreateSessionId(storeSlug);
  const { utmSource, utmMedium, utmCampaign } = getUtmParams();
  const includeHostTypeMeta = options?.includeHostTypeMeta ?? true;
  const entryHostType = includeHostTypeMeta ? getEntryHostType() : undefined;

  const normalizedEvents = events.map((event) => ({
    ...event,
    meta: {
      ...(event.meta ?? {}),
      ...(entryHostType ? { entryHostType } : {}),
    },
  }));

  const payload: TrackPayload = {
    sessionId,
    userId: options?.userId,
    referrer: document.referrer || undefined,
    utmSource,
    utmMedium,
    utmCampaign,
    deviceType: getDeviceType(),
    events: normalizedEvents,
  };

  try {
    await fetch(`/api/storefront/${encodeURIComponent(storeSlug)}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    return;
  }
}
