import crypto from "crypto";
import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import type { RawBodyRequest } from "../shared/types/raw-body";
import { and, db, eq, instagramAccounts, account, stores, products, mediaObjects, productMedia } from "@vendly/db";

export const instagramWebhookRouter: ExpressRouter = Router();

const BYPASS_SIGNATURE = process.env.NODE_ENV === "development";

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
  return parsed[0];
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

type FetchResponseLike = {
  ok: boolean;
  json: () => Promise<unknown>;
};

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
    const igAccount = await db.query.instagramAccounts.findFirst({
      where: and(eq(instagramAccounts.accountId, igUserId), eq(instagramAccounts.isActive, true)),
    });

    if (!igAccount) {
      return res.sendStatus(200);
    }

    const authAccount = await db.query.account.findFirst({
      where: and(eq(account.userId, igAccount.userId), eq(account.providerId, "instagram")),
    });

    const accessToken = authAccount?.accessToken || undefined;
    if (!accessToken) {
      return res.sendStatus(200);
    }

    const store = await db.query.stores.findFirst({
      where: eq(stores.tenantId, igAccount.tenantId),
    });

    if (!store) {
      return res.sendStatus(200);
    }

    const mediaRes = (await fetch(
      `https://graph.instagram.com/${mediaId}?fields=id,caption,media_type,media_url,thumbnail_url,permalink,children{id,media_type,media_url,thumbnail_url}&access_token=${accessToken}`
    )) as FetchResponseLike;

    const mediaJson = (await mediaRes.json()) as unknown;
    const mediaObj = asObject(mediaJson);
    if (!mediaRes.ok || mediaObj?.error) {
      return res.sendStatus(200);
    }

    const caption = typeof mediaObj?.caption === "string" ? mediaObj.caption : attachmentTitle || "";
    const parsed = parseCaption(caption, store.defaultCurrency);

    const sourceId = typeof mediaObj?.id === "string" ? mediaObj.id : String(mediaId);
    const sourceUrl = typeof mediaObj?.permalink === "string" ? mediaObj.permalink : null;
    const mediaType = typeof mediaObj?.media_type === "string" ? mediaObj.media_type : "";

    const childrenDataRaw = asObject(mediaObj?.children)?.data as unknown;
    const childrenData = Array.isArray(childrenDataRaw) ? childrenDataRaw : [];

    const existingProduct = await db.query.products.findFirst({
      where: and(eq(products.storeId, store.id), eq(products.source, "instagram"), eq(products.sourceId, sourceId)),
      columns: { id: true },
    });

    if (existingProduct) {
      return res.sendStatus(200);
    }

    const [product] = await db
      .insert(products)
      .values({
        tenantId: igAccount.tenantId,
        storeId: store.id,
        productName: parsed.productName,
        slug: slugify(parsed.productName),
        description: parsed.description,
        priceAmount: parsed.priceAmount,
        currency: parsed.currency,
        status: "draft",
        source: "instagram",
        sourceId,
        sourceUrl,
        variants: [],
      })
      .returning();

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
        const [mediaRow] = await db
          .insert(mediaObjects)
          .values({
            tenantId: igAccount.tenantId,
            blobUrl: childUrl,
            blobPathname: childId,
            contentType,
            source: "instagram",
            sourceMediaId: childId,
          })
          .returning();

        await db.insert(productMedia).values({
          tenantId: igAccount.tenantId,
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
      const mediaUrl = String(mediaObj?.media_url || mediaObj?.thumbnail_url || "");
      if (mediaUrl) {
        const contentType = mediaType === "VIDEO" ? "video/mp4" : "image/jpeg";
        const [mediaRow] = await db
          .insert(mediaObjects)
          .values({
            tenantId: igAccount.tenantId,
            blobUrl: mediaUrl,
            blobPathname: sourceId,
            contentType,
            source: "instagram",
            sourceMediaId: sourceId,
          })
          .returning();

        await db.insert(productMedia).values({
          tenantId: igAccount.tenantId,
          productId: product.id,
          mediaId: mediaRow.id,
          isFeatured: true,
          sortOrder: 0,
        });
      }
    }

    if (variantEntries.length) {
      await db
        .update(products)
        .set({ variants: variantEntries, updatedAt: new Date() })
        .where(eq(products.id, product.id));
    }
  } catch (err) {
    console.error("[InstagramWebhook] Error", err);
  }

  return res.sendStatus(200);
});
