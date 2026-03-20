import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { parseInstagramCaption } from "@/lib/instagram/parse-caption";
import { instagramRepo } from "@/repo/instagram-repo";
import { MAX_INSTAGRAM_IMPORT_ITEMS } from "@/lib/constants/instagram";

import { 
  type InstagramMediaItem, 
  instagramImportSchema 
} from "@/models";
import { slugify, copyToBlob } from "@/lib/instagram/instagram-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { storeId } = instagramImportSchema.parse(body);

    const { membership, store, instagramAuthAccount } =
      await instagramRepo.getImportContext(session.user.id, storeId);

    if (!membership) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!instagramAuthAccount?.accessToken) {
      return NextResponse.json(
        { error: "Instagram not connected" },
        { status: 400 },
      );
    }

    // 1. Fetch User Info for Profile Picture
    const userRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${instagramAuthAccount.accessToken}`,
    );
    const userData = await userRes.json();

    if (!userRes.ok || userData?.error) {
      throw new Error(
        userData?.error?.message || "Failed to fetch Instagram profile",
      );
    }

    // 2. Fetch Media
    // Using 'children' field for carousel items
    const mediaRes = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}&access_token=${instagramAuthAccount.accessToken}`,
    );
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
      throw new Error(mediaData.error.message || "Failed to fetch media");
    }

    const mediaItems: InstagramMediaItem[] = Array.isArray(mediaData?.data)
      ? mediaData.data
      : [];
    const limitedMediaItems = mediaItems.slice(0, MAX_INSTAGRAM_IMPORT_ITEMS);

    // 3. Update Account with Profile Picture
    const existing = await instagramRepo.hasTenantAccount(
      membership.tenantId,
      session.user.id,
    );

    // 3. Update Account with Profile Picture
    const igAccount = await instagramRepo.upsertInstagramAccount(membership.tenantId, session.user.id, {
      tenantId: membership.tenantId,
      userId: session.user.id,
      accountId: instagramAuthAccount.accountId,
      username: userData.username,
      profilePictureUrl: userData.profile_picture_url,
      isActive: true,
      lastSyncedAt: new Date(),
    });

    if (!igAccount) {
      throw new Error("Failed to upsert Instagram account");
    }

    if (
      userData.profile_picture_url &&
      store.logoUrl !== userData.profile_picture_url
    ) {
      await instagramRepo.updateStoreLogo(storeId, membership.tenantId, userData.profile_picture_url);
    }

    const accountId = igAccount.id;

    // 4. Create Sync Job
    const job = await instagramRepo.createSyncJob(membership.tenantId, accountId, limitedMediaItems.length);

    if (!job) {
      throw new Error("Failed to create sync job");
    }

    const jobId = job.id;

    // 5. Process Media (Inline for simplicity)
    let createdCount = 0;

    for (const item of limitedMediaItems) {
      const sourceId = String(item.id);
      const existingProduct = await instagramRepo.findExistingProductBySource(
        membership.tenantId,
        storeId,
        "instagram",
        sourceId
      );

      if (existingProduct) {
        continue;
      }

      const caption = (item.caption as string | null | undefined) || "";
      const parsed = parseInstagramCaption(caption, store.defaultCurrency);
      const slug = slugify(parsed.productName);

      const product = await instagramRepo.createProduct({
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
      });

      if (!product) {
        throw new Error("Failed to create product record");
      }

      const productId = product.id;

      createdCount++;

      if (
        item.media_type === "CAROUSEL_ALBUM" &&
        Array.isArray(item.children?.data)
      ) {
        let idx = 0;
        for (const child of item.children.data) {
          idx++;
          const childId = String(child.id);
          const childMediaType = String(child.media_type || "IMAGE");
          const childUrl = String(child.media_url || child.thumbnail_url || "");
          if (!childUrl) continue;

          const contentType =
            childMediaType === "VIDEO" ? "video/mp4" : "image/jpeg";
          const copied = await copyToBlob({
            tenantId: membership.tenantId,
            sourceUrl: childUrl,
            preferredBasename: childId,
            fallbackContentType: contentType,
          });
          
          const mediaObj = await instagramRepo.createMediaObject({
            tenantId: membership.tenantId,
            blobUrl: copied.url,
            blobPathname: copied.pathname,
            contentType: copied.contentType,
            source: "instagram",
            sourceMediaId: childId,
          });

          if (!mediaObj) {
            throw new Error("Failed to create media object");
          }

          await instagramRepo.linkProductMedia({
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
          
          const mediaObj = await instagramRepo.createMediaObject({
            tenantId: membership.tenantId,
            blobUrl: copied.url,
            blobPathname: copied.pathname,
            contentType: copied.contentType,
            source: "instagram",
            sourceMediaId: itemId,
          });

          if (!mediaObj) {
            throw new Error("Failed to create media object");
          }

          await instagramRepo.linkProductMedia({
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
    await instagramRepo.completeSyncJob(jobId, createdCount);

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
