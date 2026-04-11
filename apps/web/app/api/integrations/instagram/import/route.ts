import { parseInstagramCaption } from "@/lib/instagram/parse-caption";
import { instagramRepo } from "@/repo/instagram-repo";
import { MAX_INSTAGRAM_IMPORT_ITEMS } from "@/lib/constants/instagram";
import { type InstagramMediaItem, instagramImportSchema } from "@/models";
import { slugify, copyToBlob } from "@/lib/instagram/instagram-service";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/lib/api/response-utils";

export const POST = withApi({ schema: instagramImportSchema }, async ({ session, body }) => {
  const { storeId } = body;
  const { membership, store, instagramAuthAccount } =
    await instagramRepo.getImportContext(session.user.id, storeId);

  if (!membership) throw new HttpError("No tenant found", 404);
  if (!store) throw new HttpError("Store not found", 404);
  if (!instagramAuthAccount?.accessToken) throw new HttpError("Instagram not connected", 400);

  const userRes = await fetch(
    `https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${instagramAuthAccount.accessToken}`,
  );
  const userData = await userRes.json();
  if (!userRes.ok || userData?.error) {
    throw new HttpError(userData?.error?.message || "Failed to fetch Instagram profile", 500);
  }

  const mediaRes = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}&access_token=${instagramAuthAccount.accessToken}`,
  );
  const mediaData = await mediaRes.json();
  if (mediaData.error) throw new HttpError(mediaData.error.message || "Failed to fetch media", 500);

  const mediaItems: InstagramMediaItem[] = Array.isArray(mediaData?.data) ? mediaData.data : [];
  const limitedMediaItems = mediaItems.slice(0, MAX_INSTAGRAM_IMPORT_ITEMS);

  const igAccount = await instagramRepo.upsertInstagramAccount(membership.tenantId, session.user.id, {
    tenantId: membership.tenantId,
    userId: session.user.id,
    accountId: instagramAuthAccount.accountId,
    username: userData.username,
    profilePictureUrl: userData.profile_picture_url,
    isActive: true,
    lastSyncedAt: new Date(),
  });
  if (!igAccount) throw new HttpError("Failed to upsert Instagram account", 500);

  if (userData.profile_picture_url && store.logoUrl !== userData.profile_picture_url) {
    await instagramRepo.updateStoreLogo(storeId, membership.tenantId, userData.profile_picture_url);
  }

  const job = await instagramRepo.createSyncJob(membership.tenantId, igAccount.id, limitedMediaItems.length);
  if (!job) throw new HttpError("Failed to create sync job", 500);

  let createdCount = 0;

  for (const item of limitedMediaItems) {
    const sourceId = String(item.id);
    const existingProduct = await instagramRepo.findExistingProductBySource(
      membership.tenantId, storeId, "instagram", sourceId,
    );
    if (existingProduct) continue;

    const caption = (item.caption as string | null | undefined) || "";
    const parsed = parseInstagramCaption(caption, store.defaultCurrency);
    const product = await instagramRepo.createProduct({
      tenantId: membership.tenantId,
      storeId,
      productName: parsed.productName,
      slug: slugify(parsed.productName),
      description: parsed.description,
      priceAmount: parsed.priceAmount,
      currency: parsed.currency,
      status: "draft",
      source: "instagram",
      sourceId,
      sourceUrl: item.permalink ? String(item.permalink) : null,
      variants: null,
    });
    if (!product) throw new HttpError("Failed to create product record", 500);

    createdCount++;
    const productId = product.id;

    const mediaEntries =
      item.media_type === "CAROUSEL_ALBUM" && Array.isArray(item.children?.data)
        ? item.children.data.map((child, idx) => ({
            id: String(child.id),
            mediaType: String(child.media_type || "IMAGE"),
            url: String(child.media_url || child.thumbnail_url || ""),
            isFeatured: idx === 0,
            sortOrder: idx,
          }))
        : [{ id: String(item.id), mediaType: String(item.media_type || "IMAGE"), url: String(item.media_url || item.thumbnail_url || ""), isFeatured: true, sortOrder: 0 }];

    for (const entry of mediaEntries) {
      if (!entry.url) continue;
      const contentType = entry.mediaType === "VIDEO" ? "video/mp4" : "image/jpeg";
      const copied = await copyToBlob({
        tenantId: membership.tenantId,
        sourceUrl: entry.url,
        preferredBasename: entry.id,
        fallbackContentType: contentType,
      });
      const mediaObj = await instagramRepo.createMediaObject({
        tenantId: membership.tenantId,
        blobUrl: copied.url,
        blobPathname: copied.pathname,
        contentType: copied.contentType,
        source: "instagram",
        sourceMediaId: entry.id,
      });
      if (!mediaObj) throw new HttpError("Failed to create media object", 500);
      await instagramRepo.linkProductMedia({
        tenantId: membership.tenantId,
        productId,
        mediaId: mediaObj.id,
        isFeatured: entry.isFeatured,
        sortOrder: entry.sortOrder,
      });
    }
  }

  await instagramRepo.completeSyncJob(job.id, createdCount);

  return jsonSuccess({ ok: true, jobId: job.id, message: `Imported ${createdCount} products successfully.` });
});
