import crypto from "crypto";
import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { Receiver } from "@upstash/qstash";
import { UTApi, UTFile } from "uploadthing/server";
import type { RawBodyRequest } from "../../../shared/types/raw-body.js";

import { z } from "zod";
import { and, db, eq, instagramAccounts, instagramSyncJobs, account, stores, products, mediaObjects, productMedia, tenantMemberships } from "@shopvendly/db";

export const instagramWebhookRouter: ExpressRouter = Router();

let utapiClient: UTApi | null = null;

function getUtapi(): UTApi | null {
  if (utapiClient) return utapiClient;

  try {
    utapiClient = new UTApi();
    return utapiClient;
  } catch (err) {
    console.warn("[InstagramWebhook] UploadThing not configured; continuing without media copy", err);
    return null;
  }
}

const syncBodySchema = z.object({
  storeId: z.string().uuid(),
  userId: z.string().min(1),
});
const syncPostsBodySchema = z.object({
  storeId: z.string().uuid(),
  userId: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
});

const BYPASS_SIGNATURE = process.env.INSTAGRAM_BYPASS_SIGNATURE === "true" || process.env.NODE_ENV === "development";

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifySignature(req: RawBodyRequest): boolean {
  if (BYPASS_SIGNATURE) {
    return true;
  }

  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appSecret) return false;

  const signature = req.header("x-hub-signature-256") || "";
  const raw = req.rawBody;
  if (!raw) return false;

  const hash = crypto.createHmac("sha256", appSecret).update(raw).digest("hex");
  const expected = `sha256=${hash}`;

  return timingSafeEqual(signature, expected);
}

function asObject(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "object" || v === null) return null;
  return v as Record<string, unknown>;
}

function pickAttachmentMedia(payload: Record<string, unknown> | null | undefined) {
  if (!payload) return null;
  const mediaId = typeof payload.ig_post_media_id === "string" ? payload.ig_post_media_id : undefined;
  const title = typeof payload.title === "string" ? payload.title : undefined;
  const url = typeof payload.url === "string" ? payload.url : undefined;
  if (!mediaId && !url) return null;
  return { mediaId, title, url };
}

type AttachmentPick = { type?: string; mediaId: string | undefined; title: string | undefined; url: string | undefined };

function pickPreferredAttachment(attachments: unknown[]): AttachmentPick | null {
  const parsed: AttachmentPick[] = attachments
    .map((att) => asObject(att))
    .map((att) => {
      const type = typeof att?.type === "string" ? att.type : undefined;
      const payload = pickAttachmentMedia(asObject(att?.payload));
      return payload
        ? ({
            type,
            mediaId: payload.mediaId,
            title: payload.title,
            url: payload.url,
          } as AttachmentPick)
        : null;
    })
    .filter((v): v is AttachmentPick => Boolean(v));

  if (!parsed.length) return null;

  // Prefer ig_post, then share, then first available
  const igPost = parsed.find((p) => p.type === "ig_post");
  if (igPost) return igPost;
  const share = parsed.find((p) => p.type === "share");
  if (share) return share;
  return parsed[0] ?? null;
}

function slugify(text: string) {
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

function parseCaption(caption: string, defaultCurrency: string) {
  const raw = String(caption || "").trim();
  const match = raw.match(/^(.+?)\s*@\s*(\d+)\s*([A-Z]{3})?\s*([\s\S]*)?$/);
  if (match) {
    const productName = match[1]?.trim() || "Instagram Product";
    const priceAmount = Number.parseInt(match[2] || "0", 10) || 0;
    const currency = (match[3] || defaultCurrency || "UGX").trim();
    const desc = (match[4] || "").trim();
    return {
      productName: productName.slice(0, 100),
      priceAmount,
      currency,
      description: desc || raw || null,
    };
  }

  return {
    productName: (raw || "Instagram Product").slice(0, 100),
    priceAmount: 0,
    currency: defaultCurrency || "UGX",
    description: raw || null,
  };
}

type UploadThingSuccess = {
  key: string;
  ufsUrl: string;
};

type UploadThingResultLike = {
  data: UploadThingSuccess | null;
  error: unknown | null;
};

function assertUploadSuccess(result: UploadThingResultLike | UploadThingResultLike[]) {
  const normalized = Array.isArray(result) ? result[0] : result;
  if (!normalized || normalized.error || !normalized.data) {
    const reason = normalized?.error ? JSON.stringify(normalized.error) : "Unknown UploadThing upload error";
    throw new Error(`UploadThing upload failed: ${reason}`);
  }
  return normalized.data;
}

async function copyToUploadThing(params: {
  tenantId: string;
  sourceUrl: string;
  preferredBasename: string;
  fallbackContentType: string;
}) {
  try {
    const utapi = getUtapi();
    if (!utapi) {
      return { url: params.sourceUrl, pathname: params.preferredBasename, contentType: params.fallbackContentType };
    }

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

    const timestamp = Date.now();
    const safeBase = params.preferredBasename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${safeBase}.${ext}`;
    const customId = `${params.tenantId}/instagram/${timestamp}-${filename}`;
    const uploadFile = new UTFile([Uint8Array.from(buffer)], filename, {
      type: contentType,
      lastModified: Date.now(),
      customId,
    });

    const uploadedRes = await utapi.uploadFiles(uploadFile, {
      acl: "public-read",
      contentDisposition: "inline",
    });
    const uploaded = assertUploadSuccess(uploadedRes as UploadThingResultLike | UploadThingResultLike[]);

    return { url: uploaded.ufsUrl, pathname: uploaded.key, contentType };
  } catch (err) {
    console.warn("[InstagramWebhook] UploadThing copy failed; falling back to source URL", {
      url: params.sourceUrl,
      err,
    });
    return { url: params.sourceUrl, pathname: params.preferredBasename, contentType: params.fallbackContentType };
  }
}

type FetchResponseLike = {
  ok: boolean;
  json: () => Promise<unknown>;
};

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

type InstagramQstashPayload =
  | {
      type: "initial_import";
      tenantId: string;
      userId: string;
      storeId: string;
      jobId: string;
      limit?: number;
    }
  | {
      type: "webhook_sync";
      igUserId: string;
      mediaId: string;
      attachmentTitle?: string;
    };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getQstashReceiver() {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) return null;
  return new Receiver({ currentSigningKey, nextSigningKey });
}

async function enqueueInstagramQstash(payload: InstagramQstashPayload) {
  const qstashBaseUrl = process.env.QSTASH_BASE_URL;
  const qstashToken = process.env.QSTASH_TOKEN;
  const deliveryUrl = process.env.QSTASH_INSTAGRAM_DELIVERY_URL;

  if (!qstashBaseUrl || !qstashToken || !deliveryUrl) {
    throw new Error("Missing QStash config (QSTASH_BASE_URL, QSTASH_TOKEN, QSTASH_INSTAGRAM_DELIVERY_URL)");
  }

  const endpoint = `${qstashBaseUrl.replace(/\/$/, "")}/v2/publish/${encodeURIComponent(deliveryUrl)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${qstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to publish Instagram job to QStash: ${response.status} ${body}`);
  }
}

async function importInstagramMediaIntoProducts(params: {
  tenantId: string;
  storeId: string;
  sourceId: string;
  mediaObj: Record<string, unknown>;
  attachmentTitle?: string;
}) {
  const store = await db.query.stores.findFirst({
    where: and(eq(stores.id, params.storeId), eq(stores.tenantId, params.tenantId)),
  });

  if (!store) {
    return { created: false, skipped: true, reason: "Store not found" };
  }

  const existingProduct = await db.query.products.findFirst({
    where: and(eq(products.storeId, store.id), eq(products.source, "instagram"), eq(products.sourceId, params.sourceId)),
    columns: { id: true },
  });

  if (existingProduct) {
    return { created: false, skipped: true, reason: "Duplicate sourceId" };
  }

  const caption = typeof params.mediaObj.caption === "string" ? params.mediaObj.caption : params.attachmentTitle || "";
  const parsed = parseCaption(caption, store.defaultCurrency);
  const sourceUrl = typeof params.mediaObj.permalink === "string" ? params.mediaObj.permalink : null;
  const mediaType = typeof params.mediaObj.media_type === "string" ? params.mediaObj.media_type : "";

  const childrenDataRaw = asObject(params.mediaObj.children)?.data as unknown;
  const childrenData = Array.isArray(childrenDataRaw) ? childrenDataRaw : [];

  const [product] = await db
    .insert(products)
    .values({
      tenantId: params.tenantId,
      storeId: store.id,
      productName: parsed.productName,
      slug: slugify(parsed.productName),
      description: parsed.description,
      priceAmount: parsed.priceAmount,
      currency: parsed.currency,
      status: "draft",
      source: "instagram",
      sourceId: params.sourceId,
      sourceUrl,
      variants: [],
    })
    .returning();

  if (!product) {
    throw new Error("Failed to create product");
  }

  const variantEntries: Array<{ name: string; sourceMediaId: string; mediaObjectId: string; mediaType?: string }> = [];

  if (mediaType === "CAROUSEL_ALBUM" && childrenData.length) {
    let idx = 0;
    for (const childRaw of childrenData) {
      const child = asObject(childRaw);
      if (!child) continue;
      idx++;

      const childId = typeof child.id === "string" ? child.id : String(child.id || idx);
      const childMediaType = typeof child.media_type === "string" ? child.media_type : "IMAGE";
      const childUrl = String(child.media_url || child.thumbnail_url || "");
      if (!childUrl) continue;

      const contentType = childMediaType === "VIDEO" ? "video/mp4" : "image/jpeg";
      const copied = await copyToUploadThing({
        tenantId: params.tenantId,
        sourceUrl: childUrl,
        preferredBasename: childId,
        fallbackContentType: contentType,
      });
      const [mediaRow] = await db
        .insert(mediaObjects)
        .values({
          tenantId: params.tenantId,
          blobUrl: copied.url,
          blobPathname: copied.pathname,
          contentType: copied.contentType,
          source: "instagram",
          sourceMediaId: childId,
        })
        .returning();

      if (!mediaRow) {
        continue;
      }

      await db.insert(productMedia).values({
        tenantId: params.tenantId,
        productId: product.id,
        mediaId: mediaRow.id,
        isFeatured: idx === 1,
        sortOrder: idx - 1,
      });

      variantEntries.push({
        name: `Option ${idx}`,
        sourceMediaId: childId,
        mediaObjectId: mediaRow.id,
        mediaType: childMediaType,
      });
    }
  } else {
    const mediaUrl = String(params.mediaObj.media_url || params.mediaObj.thumbnail_url || "");
    if (mediaUrl) {
      const contentType = mediaType === "VIDEO" ? "video/mp4" : "image/jpeg";
      const copied = await copyToUploadThing({
        tenantId: params.tenantId,
        sourceUrl: mediaUrl,
        preferredBasename: params.sourceId,
        fallbackContentType: contentType,
      });
      const [mediaRow] = await db
        .insert(mediaObjects)
        .values({
          tenantId: params.tenantId,
          blobUrl: copied.url,
          blobPathname: copied.pathname,
          contentType: copied.contentType,
          source: "instagram",
          sourceMediaId: params.sourceId,
        })
        .returning();

      if (mediaRow) {
        await db.insert(productMedia).values({
          tenantId: params.tenantId,
          productId: product.id,
          mediaId: mediaRow.id,
          isFeatured: true,
          sortOrder: 0,
        });
      }
    }
  }

  if (variantEntries.length) {
    await db
      .update(products)
      .set({ variants: variantEntries, updatedAt: new Date() })
      .where(eq(products.id, product.id));
  }

  return { created: true, skipped: false };
}

async function processInitialImportJob(payload: Extract<InstagramQstashPayload, { type: "initial_import" }>) {
  const igAccount = await db.query.instagramAccounts.findFirst({
    where: and(eq(instagramAccounts.tenantId, payload.tenantId), eq(instagramAccounts.userId, payload.userId), eq(instagramAccounts.isActive, true)),
  });
  if (!igAccount) {
    throw new Error("Instagram account not found for initial import");
  }

  const authAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, payload.userId), eq(account.providerId, "instagram")),
  });
  const accessToken = authAccount?.accessToken || undefined;
  if (!accessToken) {
    throw new Error("Missing Instagram access token");
  }

  const mediaRes = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}&access_token=${accessToken}`
  );
  const mediaJson = (await mediaRes.json()) as { data?: InstagramMediaItem[]; error?: { message?: string } };
  if (!mediaRes.ok || mediaJson.error) {
    throw new Error(mediaJson.error?.message || "Failed to fetch Instagram media list");
  }

  const mediaItems = Array.isArray(mediaJson.data) ? mediaJson.data.slice(0, payload.limit ?? 50) : [];
  await db
    .update(instagramSyncJobs)
    .set({ status: "processing", mediaFetched: mediaItems.length, startedAt: new Date() })
    .where(eq(instagramSyncJobs.id, payload.jobId));

  let createdCount = 0;
  let skippedCount = 0;
  const errors: Array<{ instagramMediaId: string; errorMessage: string; timestamp: string }> = [];

  for (const item of mediaItems) {
    const mediaId = String(item.id);
    try {
      const mediaObj = asObject(item) ?? {};
      const outcome = await importInstagramMediaIntoProducts({
        tenantId: payload.tenantId,
        storeId: payload.storeId,
        sourceId: mediaId,
        mediaObj,
      });
      if (outcome.created) {
        createdCount += 1;
      } else {
        skippedCount += 1;
      }
    } catch (error) {
      skippedCount += 1;
      errors.push({
        instagramMediaId: mediaId,
        errorMessage: error instanceof Error ? error.message : "Failed to import media",
        timestamp: new Date().toISOString(),
      });
    }

    await db
      .update(instagramSyncJobs)
      .set({
        productsCreated: createdCount,
        productsSkipped: skippedCount,
        errors,
      })
      .where(eq(instagramSyncJobs.id, payload.jobId));

    await sleep(300);
  }

  await db
    .update(instagramSyncJobs)
    .set({
      status: "completed",
      productsCreated: createdCount,
      productsSkipped: skippedCount,
      errors,
      completedAt: new Date(),
    })
    .where(eq(instagramSyncJobs.id, payload.jobId));
}

async function processWebhookSyncJob(payload: Extract<InstagramQstashPayload, { type: "webhook_sync" }>) {
  const igAccount = await db.query.instagramAccounts.findFirst({
    where: and(eq(instagramAccounts.accountId, payload.igUserId), eq(instagramAccounts.isActive, true)),
  });
  if (!igAccount) return;

  const authAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, igAccount.userId), eq(account.providerId, "instagram")),
  });

  const accessToken = authAccount?.accessToken || undefined;
  if (!accessToken) return;

  const store = await db.query.stores.findFirst({
    where: eq(stores.tenantId, igAccount.tenantId),
  });
  if (!store) return;

  const mediaRes = (await fetch(
    `https://graph.instagram.com/${payload.mediaId}?fields=id,caption,media_type,media_url,thumbnail_url,permalink,children{id,media_type,media_url,thumbnail_url}&access_token=${accessToken}`
  )) as FetchResponseLike;
  const mediaJson = (await mediaRes.json()) as unknown;
  const mediaObj = asObject(mediaJson);
  if (!mediaRes.ok || mediaObj?.error) return;

  const sourceId = typeof mediaObj?.id === "string" ? mediaObj.id : String(payload.mediaId);
  await importInstagramMediaIntoProducts({
    tenantId: igAccount.tenantId,
    storeId: store.id,
    sourceId,
    mediaObj: mediaObj ?? {},
    attachmentTitle: payload.attachmentTitle,
  });
}

// POST /api/internal/instagram/sync
// Server-to-server endpoint used by apps/web after OAuth redirect to hydrate instagram_accounts and store logo.
instagramWebhookRouter.post("/internal/instagram/sync", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY;
  const provided = req.header("x-internal-api-key");

  if (!expected || !provided || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsedBody = syncBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsedBody.error.flatten() });
  }

  const { storeId, userId } = parsedBody.data;

  try {
    const membership = await db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, userId),
    });

    if (!membership) {
      return res.status(404).json({ error: "No tenant found" });
    }

    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.tenantId, membership.tenantId)),
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    const instagramAuthAccount = await db.query.account.findFirst({
      where: and(eq(account.userId, userId), eq(account.providerId, "instagram")),
    });

    if (!instagramAuthAccount?.accessToken) {
      return res.status(400).json({ error: "Instagram not connected" });
    }

    const igProfileRes = await fetch(
      `https://graph.instagram.com/v24.0/me?fields=id,username,account_type,profile_picture_url&access_token=${instagramAuthAccount.accessToken}`
    );

    const igProfileJson = (await igProfileRes.json()) as unknown;
    const igProfileObj = asObject(igProfileJson);
    if (!igProfileRes.ok || igProfileObj?.error) {
      const err = asObject(igProfileObj?.error);
      return res.status(502).json({ error: (typeof err?.message === "string" ? err.message : "Failed to fetch Instagram profile") });
    }

    const igUserId = typeof igProfileObj?.id === "string" ? igProfileObj.id : instagramAuthAccount.accountId;
    const username = typeof igProfileObj?.username === "string" ? igProfileObj.username : null;
    const accountType = typeof igProfileObj?.account_type === "string" ? igProfileObj.account_type : null;
    const profilePictureUrl = typeof igProfileObj?.profile_picture_url === "string" ? igProfileObj.profile_picture_url : null;

    const existing = await db.query.instagramAccounts.findFirst({
      where: and(eq(instagramAccounts.tenantId, membership.tenantId), eq(instagramAccounts.userId, userId)),
    });

    if (existing) {
      await db
        .update(instagramAccounts)
        .set({
          accountId: igUserId,
          username: username ?? existing.username,
          accountType: accountType ?? existing.accountType,
          profilePictureUrl: profilePictureUrl ?? existing.profilePictureUrl,
          isActive: true,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(instagramAccounts.id, existing.id));
    } else {
      await db.insert(instagramAccounts).values({
        tenantId: membership.tenantId,
        userId,
        accountId: igUserId,
        username,
        accountType,
        profilePictureUrl,
        isActive: true,
        lastSyncedAt: new Date(),
      });
    }

    if (profilePictureUrl) {
      await db
        .update(stores)
        .set({ logoUrl: profilePictureUrl, updatedAt: new Date() })
        .where(and(eq(stores.id, storeId), eq(stores.tenantId, membership.tenantId)));
    }

    return res.status(200).json({
      ok: true,
      storeId,
      logoUrl: profilePictureUrl,
      instagram: {
        userId: igUserId,
        username,
        accountType,
      },
    });
  } catch (error) {
    console.error("[InstagramSync] Error", error);
    return res.status(500).json({ error: "Sync failed" });
  }
});

// POST /api/internal/instagram/sync-posts
// Creates an async Instagram sync job and publishes it to QStash.
instagramWebhookRouter.post("/internal/instagram/sync-posts", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY;
  const provided = req.header("x-internal-api-key");
  if (!expected || !provided || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsedBody = syncPostsBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsedBody.error.flatten() });
  }

  const { storeId, userId, limit } = parsedBody.data;

  try {
    const membership = await db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.userId, userId),
    });
    if (!membership) {
      return res.status(404).json({ error: "No tenant found" });
    }

    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.tenantId, membership.tenantId)),
      columns: { id: true },
    });
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    const igAccount = await db.query.instagramAccounts.findFirst({
      where: and(eq(instagramAccounts.tenantId, membership.tenantId), eq(instagramAccounts.userId, userId), eq(instagramAccounts.isActive, true)),
    });
    if (!igAccount) {
      return res.status(400).json({ error: "Instagram not connected" });
    }

    const [job] = await db
      .insert(instagramSyncJobs)
      .values({
        tenantId: membership.tenantId,
        accountId: igAccount.id,
        status: "pending",
        mediaFetched: 0,
        productsCreated: 0,
        productsSkipped: 0,
      })
      .returning();

    if (!job) {
      throw new Error("Failed to create Instagram sync job");
    }

    await enqueueInstagramQstash({
      type: "initial_import",
      tenantId: membership.tenantId,
      userId,
      storeId,
      jobId: job.id,
      limit,
    });

    return res.status(200).json({ ok: true, jobId: job.id });
  } catch (error) {
    console.error("[InstagramSyncPosts] Error", error);
    return res.status(500).json({ error: "Failed to enqueue Instagram sync" });
  }
});

instagramWebhookRouter.post("/webhooks/qstash/instagram", async (req, res) => {
  const receiver = getQstashReceiver();
  const deliveryUrl = process.env.QSTASH_INSTAGRAM_DELIVERY_URL;
  if (!receiver || !deliveryUrl) {
    console.warn("[InstagramQStash] Missing signing keys or QSTASH_INSTAGRAM_DELIVERY_URL");
    return res.sendStatus(500);
  }

  const signature = req.header("Upstash-Signature") || req.header("upstash-signature") || "";
  const rawBody = (req as RawBodyRequest).rawBody?.toString("utf8") ?? JSON.stringify(req.body ?? {});
  const isValid = await receiver.verify({
    body: rawBody,
    signature,
    url: deliveryUrl,
  });

  if (!isValid) {
    console.warn("[InstagramQStash] Invalid signature");
    return res.sendStatus(403);
  }

  const payload = req.body as InstagramQstashPayload;
  try {
    if (payload.type === "initial_import") {
      await processInitialImportJob(payload);
    } else if (payload.type === "webhook_sync") {
      await processWebhookSyncJob(payload);
    }
    return res.sendStatus(200);
  } catch (error) {
    if (payload.type === "initial_import") {
      await db
        .update(instagramSyncJobs)
        .set({
          status: "failed",
          completedAt: new Date(),
          errors: [
            {
              instagramMediaId: "*",
              errorMessage: error instanceof Error ? error.message : "Instagram sync job failed",
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .where(eq(instagramSyncJobs.id, payload.jobId));
    }
    console.error("[InstagramQStash] Job failed", error);
    return res.sendStatus(500);
  }
});

instagramWebhookRouter.get("/webhooks/instagram", (req, res) => {
  const modeRaw = req.query["hub.mode"];
  const tokenRaw = req.query["hub.verify_token"];
  const challengeRaw = req.query["hub.challenge"];

  const mode = Array.isArray(modeRaw) ? modeRaw[0] : modeRaw;
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;
  const challenge = Array.isArray(challengeRaw) ? challengeRaw[0] : challengeRaw;

  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && verifyToken && token && String(token) === String(verifyToken)) {
    return res.status(200).send(String(challenge || ""));
  }

  return res.sendStatus(403);
});

instagramWebhookRouter.post("/webhooks/instagram", async (req, res) => {
  const rawReq = req as RawBodyRequest;
  const ok = verifySignature(rawReq);
  console.log("[InstagramWebhook] Incoming", {
    path: req.path,
    hasSignatureHeader: Boolean(req.header("x-hub-signature-256")),
    hasRawBody: Boolean(rawReq.rawBody),
    rawLen: rawReq.rawBody?.length ?? 0,
    hasAppSecret: Boolean(process.env.INSTAGRAM_APP_SECRET),
    signatureOk: ok,
    bypassSignature: BYPASS_SIGNATURE,
  });
  if (!ok) {
    console.warn("[InstagramWebhook] Signature verification failed");
    return res.sendStatus(403);
  }

  const payloadObj = asObject(req.body);
  const entry = (payloadObj?.entry as unknown as unknown[] | undefined)?.[0];
  const entryObj = asObject(entry);
  const changes = (entryObj?.changes as unknown as unknown[] | undefined)?.[0];
  const changesObj = asObject(changes);
  const value = asObject(changesObj?.value);

  // Messaging webhook attachments (new ig_post + legacy share)
  const messaging = (entryObj?.messaging as unknown as unknown[] | undefined)?.[0];
  const messagingObj = asObject(messaging);
  const messageObj = asObject(messagingObj?.message);
  const attachmentsRaw = (messageObj?.attachments as unknown as unknown[] | undefined) || [];
  const preferredAttachment = pickPreferredAttachment(attachmentsRaw);

  const igUserId =
    (typeof entryObj?.id === "string" ? entryObj.id : undefined) ||
    (typeof asObject(value?.from)?.id === "string" ? (asObject(value?.from)?.id as string) : undefined);

  const mediaIdFromChange =
    (typeof value?.media_id === "string" ? value.media_id : undefined) ||
    (typeof asObject(value?.media)?.id === "string" ? (asObject(value?.media)?.id as string) : undefined) ||
    (typeof value?.id === "string" ? value.id : undefined);

  const mediaId = preferredAttachment?.mediaId || mediaIdFromChange;
  const attachmentTitle = preferredAttachment?.title;

  console.log("[InstagramWebhook] Parsed payload", {
    igUserId,
    mediaId,
    attachmentType: preferredAttachment?.type,
    attachmentTitle,
    hasMessaging: Boolean(messagingObj),
    hasEntry: Boolean(entryObj),
    hasChanges: Boolean(changesObj),
    hasValue: Boolean(value),
  });

  if (!igUserId || !mediaId) {
    return res.sendStatus(200);
  }

  try {
    await enqueueInstagramQstash({
      type: "webhook_sync",
      igUserId,
      mediaId,
      attachmentTitle,
    });
  } catch (error) {
    console.error("[InstagramWebhook] Failed to enqueue QStash job", error);
  }

  return res.sendStatus(200);
});