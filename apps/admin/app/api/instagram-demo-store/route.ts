import { NextResponse } from "next/server";
import { UTApi, UTFile } from "uploadthing/server";
import { and, eq } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import {
  mediaObjects,
  productMedia,
  products,
  stores,
  tenants,
} from "@shopvendly/db/schema";
import { checkSuperAdminApi } from "@/lib/auth-guard";

type MediaVariant = {
  sourceId: string;
  mediaUrl: string;
  mediaType: string;
};

type NormalizedPost = {
  sourceId: string;
  postUrl: string | null;
  caption: string;
  productName: string;
  description: string;
  variants: MediaVariant[];
};

const MAX_POSTS = 25;
const utapi = new UTApi();

function sanitizeHandle(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9._]/g, "").replace(/^\.+|\.+$/g, "");
}

async function fetchApifyPosts(params: {
  token: string;
  actorId: string;
  profileUrl: string;
  handle: string;
  maxPosts: number;
}): Promise<Record<string, unknown>[]> {
  const endpoint = new URL(`https://api.apify.com/v2/acts/${encodeURIComponent(params.actorId)}/run-sync-get-dataset-items`);
  endpoint.searchParams.set("token", params.token);
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("clean", "true");
  endpoint.searchParams.set("limit", String(params.maxPosts));

  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: [params.profileUrl, params.handle],
      directUrls: [params.profileUrl],
      resultsLimit: params.maxPosts,
      maxPostsPerProfile: params.maxPosts,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Apify request failed (${response.status}): ${body || "Unknown error"}`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error("Apify response payload is not an array");
  }

  return payload.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
}

function extractInstagramHandle(profileUrl: string): string | null {
  const withProtocol = /^https?:\/\//i.test(profileUrl) ? profileUrl : `https://${profileUrl}`;

  try {
    const parsed = new URL(withProtocol);
    if (!/instagram\.com$/i.test(parsed.hostname) && !/www\.instagram\.com$/i.test(parsed.hostname)) {
      return null;
    }

    const firstPath = parsed.pathname.split("/").filter(Boolean)[0];
    if (!firstPath) return null;
    if (["p", "reel", "explore", "stories", "accounts"].includes(firstPath.toLowerCase())) {
      return null;
    }

    const handle = sanitizeHandle(firstPath.replace(/^@/, ""));
    return handle || null;
  } catch {
    return null;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

async function ensureUniqueStoreSlug(base: string): Promise<string> {
  const fallback = slugify(base) || "store";
  let slug = fallback;
  let count = 1;

  while (true) {
    const existing = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
      columns: { id: true },
    });

    if (!existing) return slug;

    slug = `${fallback}-${count}`;
    count += 1;
  }
}

async function ensureUniqueTenantSlug(base: string): Promise<string> {
  const fallback = slugify(base) || "tenant";
  let slug = fallback;
  let count = 1;

  while (true) {
    const existing = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
      columns: { id: true },
    });

    if (!existing) return slug;

    slug = `${fallback}-${count}`;
    count += 1;
  }
}

async function ensureUniqueProductSlug(storeId: string, title: string): Promise<string> {
  const fallback = slugify(title) || "instagram-post";
  let slug = fallback;
  let count = 1;

  while (true) {
    const existing = await db.query.products.findFirst({
      where: and(eq(products.storeId, storeId), eq(products.slug, slug)),
      columns: { id: true },
    });

    if (!existing) return slug;

    slug = `${fallback}-${count}`;
    count += 1;
  }
}

function getCaption(item: Record<string, unknown>): string {
  if (typeof item.caption === "string") return item.caption.trim();
  if (typeof item.text === "string") return item.text.trim();
  return "";
}

function normalizeMediaUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  return value.length > 0 ? value : null;
}

function normalizePost(item: Record<string, unknown>, index: number): NormalizedPost | null {
  const sourceId = String(item.id ?? item.shortCode ?? item.code ?? item.url ?? `post-${index + 1}`);
  const caption = getCaption(item);

  const firstLine = caption.split("\n").map((line) => line.trim()).find(Boolean);
  const productName = (firstLine || `Instagram Post ${index + 1}`).slice(0, 100);
  const description = caption || productName;

  const postUrl = normalizeMediaUrl(item.url) || normalizeMediaUrl(item.permalink) || null;

  const variants: MediaVariant[] = [];

  const children = Array.isArray(item.childPosts)
    ? item.childPosts
    : Array.isArray(item.children)
      ? item.children
      : null;

  if (children && children.length > 0) {
    for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
      const child = children[childIndex];
      if (!child || typeof child !== "object") continue;

      const childRecord = child as Record<string, unknown>;
      const mediaUrl =
        normalizeMediaUrl(childRecord.displayUrl) ||
        normalizeMediaUrl(childRecord.imageUrl) ||
        normalizeMediaUrl(childRecord.videoUrl) ||
        normalizeMediaUrl(childRecord.url);

      if (!mediaUrl) continue;

      variants.push({
        sourceId: String(childRecord.id ?? `${sourceId}-${childIndex + 1}`),
        mediaUrl,
        mediaType: typeof childRecord.type === "string" ? childRecord.type : "IMAGE",
      });
    }
  }

  if (variants.length === 0) {
    const images = Array.isArray(item.images) ? item.images : [];
    for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
      const imageRaw = images[imageIndex];
      const imageUrl =
        normalizeMediaUrl(imageRaw) ||
        (imageRaw && typeof imageRaw === "object"
          ? normalizeMediaUrl((imageRaw as Record<string, unknown>).url)
          : null);

      if (!imageUrl) continue;

      variants.push({
        sourceId: `${sourceId}-img-${imageIndex + 1}`,
        mediaUrl: imageUrl,
        mediaType: "IMAGE",
      });
    }
  }

  if (variants.length === 0) {
    const fallbackMediaUrl =
      normalizeMediaUrl(item.displayUrl) ||
      normalizeMediaUrl(item.imageUrl) ||
      normalizeMediaUrl(item.videoUrl);

    if (fallbackMediaUrl) {
      variants.push({
        sourceId,
        mediaUrl: fallbackMediaUrl,
        mediaType: typeof item.type === "string" ? item.type : "IMAGE",
      });
    }
  }

  if (variants.length === 0) return null;

  return {
    sourceId,
    postUrl,
    caption,
    productName,
    description,
    variants,
  };
}

function extensionFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("mp4") || contentType.includes("video")) return "mp4";
  return "jpg";
}

async function copyToStorage(params: {
  tenantId: string;
  mediaUrl: string;
  sourceId: string;
}): Promise<{ url: string; pathname: string; contentType: string }> {
  const res = await fetch(params.mediaUrl);
  if (!res.ok) {
    throw new Error(`Failed to download media: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const ext = extensionFromContentType(contentType);
  const safeSourceId = params.sourceId.replace(/[^a-zA-Z0-9-_]/g, "_");
  const fileName = `${safeSourceId}.${ext}`;
  const customId = `${params.tenantId}/instagram/${Date.now()}-${fileName}`;

  const uploadFile = new UTFile([Uint8Array.from(buffer)], fileName, {
    type: contentType,
    customId,
    lastModified: Date.now(),
  });

  const upload = await utapi.uploadFiles(uploadFile, {
    acl: "public-read",
    contentDisposition: "inline",
  });

  const firstResult = Array.isArray(upload) ? upload[0] : upload;
  if (!firstResult?.data || firstResult.error) {
    throw new Error("Failed to upload media to storage");
  }

  return {
    url: firstResult.data.ufsUrl,
    pathname: firstResult.data.key,
    contentType,
  };
}

export async function POST(req: Request) {
  const auth = await checkSuperAdminApi(["super_admin"]);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as { profileUrl?: string };
    const profileUrl = body?.profileUrl?.trim();

    if (!profileUrl) {
      return NextResponse.json({ error: "Instagram profile URL is required" }, { status: 400 });
    }

    const handle = extractInstagramHandle(profileUrl);
    if (!handle) {
      return NextResponse.json({ error: "Invalid Instagram profile URL" }, { status: 400 });
    }

    const apifyToken = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      return NextResponse.json({ error: "Missing APIFY_TOKEN" }, { status: 500 });
    }

    const actorId = process.env.APIFY_INSTAGRAM_ACTOR_ID || "apify/instagram-post-scraper";
    const apifyItems = await fetchApifyPosts({
      token: apifyToken,
      actorId,
      profileUrl,
      handle,
      maxPosts: MAX_POSTS,
    });

    const normalizedPosts = apifyItems
      .map((item, index) => normalizePost(item, index))
      .filter((item): item is NormalizedPost => Boolean(item));

    if (normalizedPosts.length === 0) {
      return NextResponse.json({ error: "No importable posts returned from Apify" }, { status: 422 });
    }

    const demoEmail = `demo+instagram-${handle}@shopvendly.local`;
    let tenant = await db.query.tenants.findFirst({
      where: eq(tenants.billingEmail, demoEmail),
    });

    if (!tenant) {
      const tenantSlug = await ensureUniqueTenantSlug(`ig-${handle}`);
      const [createdTenant] = await db
        .insert(tenants)
        .values({
          fullName: `${handle} Demo Owner`,
          slug: tenantSlug,
          billingEmail: demoEmail,
          status: "onboarding",
          onboardingStep: "signup",
          onboardingData: {},
        })
        .returning();

      if (!createdTenant) {
        throw new Error("Failed to create demo tenant");
      }

      tenant = createdTenant;
    }

    let store = await db.query.stores.findFirst({
      where: eq(stores.tenantId, tenant.id),
    });

    if (!store) {
      const storeSlug = await ensureUniqueStoreSlug(handle);
      const [createdStore] = await db
        .insert(stores)
        .values({
          tenantId: tenant.id,
          name: `@${handle}`,
          slug: storeSlug,
          description: `Demo store generated from @${handle} Instagram posts`,
          status: true,
        })
        .returning();

      if (!createdStore) {
        throw new Error("Failed to create demo store");
      }

      store = createdStore;
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ sourceId: string; reason: string }> = [];

    for (const post of normalizedPosts) {
      try {
        const existing = await db.query.products.findFirst({
          where: and(
            eq(products.storeId, store.id),
            eq(products.source, "instagram"),
            eq(products.sourceId, post.sourceId)
          ),
          columns: { id: true },
        });

        if (existing) {
          skippedCount += 1;
          continue;
        }

        const productSlug = await ensureUniqueProductSlug(store.id, post.productName);
        const [product] = await db
          .insert(products)
          .values({
            tenantId: tenant.id,
            storeId: store.id,
            productName: post.productName,
            slug: productSlug,
            description: post.description,
            priceAmount: 0,
            currency: store.defaultCurrency,
            status: "draft",
            source: "instagram",
            sourceId: post.sourceId,
            sourceUrl: post.postUrl,
            variants: [],
          })
          .returning();

        if (!product) {
          throw new Error("Failed to create product row");
        }

        const variantEntries: Array<{
          name: string;
          sourceMediaId: string;
          mediaObjectId: string;
          mediaType: string;
        }> = [];

        for (const [variantIndex, variant] of post.variants.entries()) {
          const uploaded = await copyToStorage({
            tenantId: tenant.id,
            mediaUrl: variant.mediaUrl,
            sourceId: variant.sourceId,
          });

          const [media] = await db
            .insert(mediaObjects)
            .values({
              tenantId: tenant.id,
              blobUrl: uploaded.url,
              blobPathname: uploaded.pathname,
              contentType: uploaded.contentType,
              source: "instagram",
              sourceMediaId: variant.sourceId,
            })
            .returning();

          if (!media) continue;

          await db.insert(productMedia).values({
            tenantId: tenant.id,
            productId: product.id,
            mediaId: media.id,
            sortOrder: variantIndex,
            isFeatured: variantIndex === 0,
          });

          variantEntries.push({
            name: `Variant ${variantIndex + 1}`,
            sourceMediaId: variant.sourceId,
            mediaObjectId: media.id,
            mediaType: variant.mediaType,
          });
        }

        if (variantEntries.length === 0) {
          await db.delete(products).where(eq(products.id, product.id));
          skippedCount += 1;
          continue;
        }

        if (variantEntries.length > 1) {
          await db
            .update(products)
            .set({ variants: variantEntries, updatedAt: new Date() })
            .where(eq(products.id, product.id));
        }

        importedCount += 1;
      } catch (error) {
        skippedCount += 1;
        errors.push({
          sourceId: post.sourceId,
          reason: error instanceof Error ? error.message : "Unknown import error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      handle,
      storeId: store.id,
      storeSlug: store.slug,
      importedCount,
      skippedCount,
      errors,
    });
  } catch (error) {
    console.error("Instagram demo store import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import Instagram profile" },
      { status: 500 }
    );
  }
}
