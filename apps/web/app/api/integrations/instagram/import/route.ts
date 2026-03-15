import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { tenantMemberships, instagramAccounts, instagramSyncJobs, account, stores } from "@shopvendly/db/schema";
import { eq, and } from "@shopvendly/db";
import { z } from "zod";
import { parseInstagramCaption } from "@/lib/instagram/parse-caption";
import { mediaService } from "@/features/media/lib/media-service";

const MAX_INSTAGRAM_IMPORT_ITEMS = 30;

type InstagramMediaChild = {
  id: string | number;
  media_type?: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
};

type InstagramMediaItem = {
  id: string | number;
  caption?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
  permalink?: string | null;
  children?: { data?: InstagramMediaChild[] | null } | null;
};

const importSchema = z.object({
  storeId: z.string().uuid(),
});

// Helper to create slug
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 50) + "-" + Math.random().toString(36).substring(2, 6);
}

async function copyToBlob(params: {
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

    const contentType = res.headers.get("content-type") || params.fallbackContentType;
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
      "instagram"
    );

    return { url: uploadResult.url, pathname: uploadResult.pathname, contentType };
  } catch (err) {
    console.warn("[InstagramImport] Blob copy failed; falling back to source URL", {
      url: params.sourceUrl,
      err,
    });
    return { url: params.sourceUrl, pathname: params.preferredBasename, contentType: params.fallbackContentType };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, session.user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    const body = await request.json();
    const { storeId } = importSchema.parse(body);

    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.tenantId, membership.tenantId)),
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const instagramAuthAccount = await db.query.account.findFirst({
      where: and(eq(account.userId, session.user.id), eq(account.providerId, "instagram")),
    });

    if (!instagramAuthAccount?.accessToken) {
      return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });
    }

    // 1. Fetch User Info for Profile Picture
    const userRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${instagramAuthAccount.accessToken}`
    );
    const userData = await userRes.json();

    if (!userRes.ok || userData?.error) {
      throw new Error(userData?.error?.message || "Failed to fetch Instagram profile");
    }

    // 2. Fetch Media
    // Using 'children' field for carousel items
    const mediaRes = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}&access_token=${instagramAuthAccount.accessToken}`
    );
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
      throw new Error(mediaData.error.message || "Failed to fetch media");
    }

    const mediaItems: InstagramMediaItem[] = Array.isArray(mediaData?.data) ? mediaData.data : [];
    const limitedMediaItems = mediaItems.slice(0, MAX_INSTAGRAM_IMPORT_ITEMS);

    // 3. Update Account with Profile Picture
    const existing = await db.query.instagramAccounts.findFirst({
      where: and(eq(instagramAccounts.tenantId, membership.tenantId), eq(instagramAccounts.userId, session.user.id)),
    });

    const accountValues = {
      tenantId: membership.tenantId,
      userId: session.user.id,
      accountId: instagramAuthAccount.accountId,
      username: userData.username,
      profilePictureUrl: userData.profile_picture_url,
      isActive: true,
      lastSyncedAt: new Date(),
    };

    let igAccount;
    if (existing) {
      [igAccount] = await db
        .update(instagramAccounts)
        .set(accountValues)
        .where(eq(instagramAccounts.id, existing.id))
        .returning();
    } else {
      [igAccount] = await db.insert(instagramAccounts).values(accountValues).returning();
    }

    if (!igAccount) {
      throw new Error("Failed to upsert Instagram account");
    }

    if (userData.profile_picture_url && store.logoUrl !== userData.profile_picture_url) {
      await db
        .update(stores)
        .set({
          logoUrl: userData.profile_picture_url,
          updatedAt: new Date(),
        })
        .where(and(eq(stores.id, storeId), eq(stores.tenantId, membership.tenantId)));
    }

    const accountId = igAccount.id;

    // 4. Create Sync Job
    const [job] = await db
      .insert(instagramSyncJobs)
      .values({
        tenantId: membership.tenantId,
        accountId,
        status: "processing",
        mediaFetched: limitedMediaItems.length,
        startedAt: new Date(),
      })
      .returning();

    if (!job) {
      throw new Error("Failed to create sync job");
    }

    const jobId = job.id;

    // 5. Process Media (Inline for simplicity)
    let createdCount = 0;

    const { products, mediaObjects, productMedia } = await import("@shopvendly/db/schema");

    for (const item of limitedMediaItems) {
      const sourceId = String(item.id);
      const existingProduct = await db.query.products.findFirst({
        where: and(
          eq(products.tenantId, membership.tenantId),
          eq(products.storeId, storeId),
          eq(products.source, "instagram"),
          eq(products.sourceId, sourceId),
        ),
        columns: { id: true },
      });

      if (existingProduct) {
        continue;
      }

      const caption = (item.caption as string | null | undefined) || "";
      const parsed = parseInstagramCaption(caption, store.defaultCurrency);
      const slug = slugify(parsed.productName);

      const [product] = await db
        .insert(products)
        .values({
          tenantId: membership.tenantId,
          storeId: storeId,
          productName: parsed.productName,
          slug: slug,
          description: parsed.description,
          priceAmount: parsed.priceAmount,
          currency: parsed.currency,
          status: "draft",
          source: "instagram",
          sourceId,
          sourceUrl: item.permalink ? String(item.permalink) : null,
          variants: null,
        })
        .returning();

      if (!product) {
        throw new Error("Failed to create product record");
      }

      const productId = product.id;

      createdCount++;

      if (item.media_type === "CAROUSEL_ALBUM" && Array.isArray(item.children?.data)) {
        let idx = 0;
        for (const child of item.children.data) {
          idx++;
          const childId = String(child.id);
          const childMediaType = String(child.media_type || "IMAGE");
          const childUrl = String(child.media_url || child.thumbnail_url || "");
          if (!childUrl) continue;

          const contentType = childMediaType === "VIDEO" ? "video/mp4" : "image/jpeg";
          const copied = await copyToBlob({
            tenantId: membership.tenantId,
            sourceUrl: childUrl,
            preferredBasename: childId,
            fallbackContentType: contentType,
          });
          const [mediaObj] = await db
            .insert(mediaObjects)
            .values({
              tenantId: membership.tenantId,
              blobUrl: copied.url,
              blobPathname: copied.pathname,
              contentType: copied.contentType,
              source: "instagram",
              sourceMediaId: childId,
            })
            .returning();

          if (!mediaObj) {
            throw new Error("Failed to create media object");
          }

          await db.insert(productMedia).values({
            tenantId: membership.tenantId,
            productId,
            mediaId: mediaObj.id,
            isFeatured: idx === 1,
            sortOrder: idx - 1,
          });
        }
      } else {
        const itemId = String(item.id);
        const itemType = String(item.media_type || "IMAGE");
        const itemUrl = String(item.media_url || item.thumbnail_url || "");
        if (itemUrl) {
          const contentType = itemType === "VIDEO" ? "video/mp4" : "image/jpeg";
          const copied = await copyToBlob({
            tenantId: membership.tenantId,
            sourceUrl: itemUrl,
            preferredBasename: itemId,
            fallbackContentType: contentType,
          });
          const [mediaObj] = await db
            .insert(mediaObjects)
            .values({
              tenantId: membership.tenantId,
              blobUrl: copied.url,
              blobPathname: copied.pathname,
              contentType: copied.contentType,
              source: "instagram",
              sourceMediaId: itemId,
            })
            .returning();

          if (!mediaObj) {
            throw new Error("Failed to create media object");
          }

          await db.insert(productMedia).values({
            tenantId: membership.tenantId,
            productId,
            mediaId: mediaObj.id,
            isFeatured: true,
            sortOrder: 0,
          });
        }
      }
    }

    // Update Job Status
    await db
      .update(instagramSyncJobs)
      .set({
        status: "completed",
        productsCreated: createdCount,
        completedAt: new Date()
      })
      .where(eq(instagramSyncJobs.id, jobId));

    return NextResponse.json({
      ok: true,
      jobId,
      message: `Imported ${createdCount} products successfully.`,
    });
  } catch (error: unknown) {
    console.error("Instagram import error:", error);
    const message = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
