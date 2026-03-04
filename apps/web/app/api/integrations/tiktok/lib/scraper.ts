import { mediaService } from "@/features/media/lib/media-service";

export const MAX_TIKTOK_IMPORT_POSTS = 25;

export type ScrapedTikTokPost = {
  sourcePostId: string;
  title: string | null;
  videoDescription: string | null;
  duration: number | null;
  coverImageUrl: string | null;
  embedLink: string | null;
  shareUrl: string | null;
  createdAtSource: Date | null;
  sortOrder: number;
};

function sanitizeHandle(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/^\.+|\.+$/g, "");
}

export function normalizeTikTokProfile(input: string): { profileUrl: string; handle: string } {
  const raw = input.trim();
  if (!raw) {
    throw new Error("TikTok profile URL or handle is required");
  }

  if (/^@?[a-zA-Z0-9._]+$/.test(raw)) {
    const handle = sanitizeHandle(raw);
    if (!handle) {
      throw new Error("Invalid TikTok handle");
    }

    return {
      handle,
      profileUrl: `https://www.tiktok.com/@${handle}`,
    };
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Invalid TikTok URL");
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.includes("tiktok.com")) {
    throw new Error("Profile URL must be from tiktok.com");
  }

  const firstPath = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
  const handle = sanitizeHandle(firstPath.replace(/^@/, ""));

  if (!handle) {
    throw new Error("Could not extract TikTok handle from URL");
  }

  return {
    handle,
    profileUrl: `https://www.tiktok.com/@${handle}`,
  };
}

async function fetchApifyTikTokItems(params: {
  token: string;
  actorId: string;
  profileUrl: string;
  handle: string;
  maxPosts: number;
}): Promise<Record<string, unknown>[]> {
  const endpoint = new URL(
    `https://api.apify.com/v2/acts/${encodeURIComponent(params.actorId)}/run-sync-get-dataset-items`
  );
  endpoint.searchParams.set("token", params.token);
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("clean", "true");
  endpoint.searchParams.set("limit", String(params.maxPosts));

  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      profiles: [params.profileUrl, params.handle, `@${params.handle}`],
      profileUrls: [params.profileUrl],
      usernames: [params.handle],
      resultsLimit: params.maxPosts,
      maxItems: params.maxPosts,
      maxPosts: params.maxPosts,
      maxVideos: params.maxPosts,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`TikTok scraper failed (${response.status}): ${body || "Unknown error"}`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error("TikTok scraper response was not an array");
  }

  return payload.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return null;
}

function inferEmbedLink(sourcePostId: string, shareUrl: string | null, fallbackEmbed: string | null): string | null {
  if (fallbackEmbed) return fallbackEmbed;
  if (shareUrl && shareUrl.includes("/embed/")) return shareUrl;
  if (!sourcePostId) return null;
  return `https://www.tiktok.com/embed/v2/${sourcePostId}`;
}

function normalizeCreatedAt(value: unknown): Date | null {
  const numeric = asNumber(value);
  if (numeric) {
    const millis = numeric > 10_000_000_000 ? numeric : numeric * 1000;
    const date = new Date(millis);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const text = asString(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeScrapedPost(item: Record<string, unknown>, index: number): ScrapedTikTokPost | null {
  const sourcePostId = pickString(item, ["id", "videoId", "aweme_id", "awemeId", "uid", "postId"]);
  if (!sourcePostId) return null;

  const title = pickString(item, ["title"]);
  const videoDescription = pickString(item, ["text", "desc", "description", "video_description"]);
  const coverImageUrl =
    pickString(item, ["cover", "coverUrl", "thumbnail", "thumbnailUrl", "image", "imageUrl"]) ??
    (item.covers && typeof item.covers === "object"
      ? pickString(item.covers as Record<string, unknown>, ["default", "origin", "dynamic", "url"])
      : null);

  const shareUrl = pickString(item, ["webVideoUrl", "url", "shareUrl", "share_url", "permalink"]);
  const embedLink = inferEmbedLink(
    sourcePostId,
    shareUrl,
    pickString(item, ["embedLink", "embed_link", "embedUrl", "embed_url"])
  );

  return {
    sourcePostId,
    title,
    videoDescription,
    duration: asNumber(item.duration),
    coverImageUrl,
    shareUrl,
    embedLink,
    createdAtSource: normalizeCreatedAt(item.createTime ?? item.create_time ?? item.createdAt),
    sortOrder: index,
  };
}

async function copyCoverImage(params: {
  tenantId: string;
  sourceUrl: string;
  sourcePostId: string;
}): Promise<string> {
  const response = await fetch(params.sourceUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to download TikTok cover (${response.status})`);
  }

  const arrayBuf = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : contentType.includes("gif")
        ? "gif"
        : "jpg";

  const uploadResult = await mediaService.uploadSingle(
    {
      buffer,
      originalname: `${params.sourcePostId}.${ext}`,
      mimetype: contentType,
    },
    params.tenantId,
    "tiktok"
  );

  return uploadResult.url;
}

export async function scrapeTikTokPosts(params: {
  profileInput: string;
  tenantId: string;
  maxPosts?: number;
}): Promise<{ profileUrl: string; handle: string; posts: ScrapedTikTokPost[] }> {
  const { profileUrl, handle } = normalizeTikTokProfile(params.profileInput);
  const maxPosts = Math.min(Math.max(params.maxPosts ?? MAX_TIKTOK_IMPORT_POSTS, 1), MAX_TIKTOK_IMPORT_POSTS);

  const apifyToken = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    throw new Error("Missing APIFY_TOKEN for TikTok scraping");
  }

  const actorId = process.env.APIFY_TIKTOK_ACTOR_ID;
  if (!actorId) {
    throw new Error("Missing APIFY_TIKTOK_ACTOR_ID for TikTok scraping");
  }

  const rawItems = await fetchApifyTikTokItems({
    token: apifyToken,
    actorId,
    profileUrl,
    handle,
    maxPosts,
  });

  const normalized = rawItems
    .map((item, index) => normalizeScrapedPost(item, index))
    .filter((item): item is ScrapedTikTokPost => Boolean(item))
    .slice(0, maxPosts);

  if (!normalized.length) {
    throw new Error("No importable TikTok posts were returned");
  }

  const downloadedPosts = await Promise.all(
    normalized.map(async (post) => {
      if (!post.coverImageUrl) {
        return post;
      }

      try {
        const storedCoverUrl = await copyCoverImage({
          tenantId: params.tenantId,
          sourceUrl: post.coverImageUrl,
          sourcePostId: post.sourcePostId,
        });

        return {
          ...post,
          coverImageUrl: storedCoverUrl,
        };
      } catch {
        return post;
      }
    })
  );

  return {
    profileUrl,
    handle,
    posts: downloadedPosts,
  };
}
