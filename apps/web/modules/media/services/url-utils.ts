const UPLOADTHING_HOST_SUFFIX = ".ufs.sh";
const UPLOADTHING_CANONICAL_HOST = "utfs.io";

export type MediaEntry = {
  media?: {
    blobUrl?: string | null;
    blobPathname?: string | null;
    contentType?: string | null;
  } | null;
} | null | undefined;

function isUploadThingHost(hostname: string) {
  return hostname === UPLOADTHING_CANONICAL_HOST || hostname.endsWith(UPLOADTHING_HOST_SUFFIX);
}

export function toCanonicalUploadThingUrl(rawUrl: string) {
  if (!rawUrl) return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    const fileId = parsed.pathname.split("/").filter(Boolean).pop();
    if (!fileId) return rawUrl;

    if (!isUploadThingHost(parsed.hostname)) {
      return rawUrl;
    }

    const typeParam =
      parsed.searchParams.get("x-ut-file-type") ||
      parsed.searchParams.get("file-type");

    const canonicalBase = `https://${UPLOADTHING_CANONICAL_HOST}/f/${fileId}`;
    if (typeParam) {
      const encodedType = encodeURIComponent(typeParam);
      return `${canonicalBase}?x-ut-file-type=${encodedType}`;
    }

    return canonicalBase;
  } catch {
    return rawUrl;
  }
}

export function normalizeMediaUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];

  return urls
    .filter((url): url is string => typeof url === "string" && url.length > 0)
    .map((url) => toCanonicalUploadThingUrl(url));
}

export function resolveMediaUrl(entry?: MediaEntry): string | null {
  if (!entry) return null;

  const media = "media" in (entry as NonNullable<MediaEntry>) && (entry as any).media
    ? (entry as any).media
    : entry;

  const blobPathname = media?.blobPathname ?? undefined;
  const blobUrl = media?.blobUrl ?? undefined;

  if (blobPathname) {
    if (/^https?:\/\//i.test(blobPathname)) {
      return toCanonicalUploadThingUrl(blobPathname);
    }

    return `https://${UPLOADTHING_CANONICAL_HOST}/f/${blobPathname.replace(/^\/+/, "")}`;
  }

  if (blobUrl) {
    return toCanonicalUploadThingUrl(blobUrl);
  }

  return null;
}

export function resolveMediaContentType(entry?: MediaEntry): string | null {
  if (!entry) return null;

  const media = "media" in (entry as NonNullable<MediaEntry>) && (entry as any).media
    ? (entry as any).media
    : entry;

  return media?.contentType ?? null;
}
