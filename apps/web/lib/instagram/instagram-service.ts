import { mediaService } from "@/modules/media/lib/media-service";

// Helper to create slug
export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 50) +
    "-" +
    Math.random().toString(36).substring(2, 6)
  );
}

export async function copyToBlob(params: {
  tenantId: string;
  sourceUrl: string;
  preferredBasename: string;
  fallbackContentType: string;
}) {
  try {
    const res = await fetch(params.sourceUrl);
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status}`);
    }

    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    const contentType =
      res.headers.get("content-type") || params.fallbackContentType;
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : contentType.includes("gif")
          ? "gif"
          : contentType.includes("mp4")
            ? "mp4"
            : "jpg";

    const uploadResult = await mediaService.uploadSingle(
      {
        buffer,
        originalname: `${params.preferredBasename}.${ext}`,
        mimetype: contentType,
      },
      params.tenantId,
      "instagram",
    );

    return {
      url: uploadResult.url,
      pathname: uploadResult.pathname,
      contentType,
    };
  } catch (err) {
    console.warn(
      "[InstagramImport] Blob copy failed; falling back to source URL",
      {
        url: params.sourceUrl,
        err,
      },
    );
    return {
      url: params.sourceUrl,
      pathname: params.preferredBasename,
      contentType: params.fallbackContentType,
    };
  }
}

