import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  and,
  db,
  eq,
  instagramAccounts,
  account,
  stores,
  products,
  mediaObjects,
  productMedia,
} from "@shopvendly/db";
import { mediaService } from "@/features/media/lib/media-service";

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
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
    console.warn("[InstagramWebhook] Blob copy failed; falling back to source URL", {
      url: params.sourceUrl,
      err,
    });
    return { url: params.sourceUrl, pathname: params.preferredBasename, contentType: params.fallbackContentType };
  }
}

async function verifySignature(request: NextRequest): Promise<boolean> {
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appSecret) return false;

  const signature = request.headers.get("x-hub-signature-256") || "";
  const raw = Buffer.from(await request.clone().arrayBuffer());

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

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && verifyToken && token && String(token) === String(verifyToken)) {
    return new NextResponse(String(challenge || ""), { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const ok = await verifySignature(request);
  if (!ok) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const payloadObj = asObject(body);
  const entry = (payloadObj?.entry as unknown as unknown[] | undefined)?.[0];
  const entryObj = asObject(entry);

  const igUserId = typeof entryObj?.id === "string" ? entryObj.id : undefined;
  const changes = (entryObj?.changes as unknown as unknown[] | undefined)?.[0];
  const changesObj = asObject(changes);
  const value = asObject(changesObj?.value);

  // Messaging attachments (new ig_post + legacy share)
  const messaging = (entryObj?.messaging as unknown as unknown[] | undefined)?.[0];
  const messagingObj = asObject(messaging);
  const messageObj = asObject(messagingObj?.message);
  const attachmentsRaw = (messageObj?.attachments as unknown as unknown[] | undefined) || [];
  const preferredAttachment = pickPreferredAttachment(attachmentsRaw);

  const mediaIdFromChange = typeof value?.media_id === "string" ? value.media_id : undefined;
  const mediaId = preferredAttachment?.mediaId || mediaIdFromChange;
  const attachmentTitle = preferredAttachment?.title;

  if (!igUserId || !mediaId) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const igAccount = await db.query.instagramAccounts.findFirst({
      where: and(eq(instagramAccounts.accountId, igUserId), eq(instagramAccounts.isActive, true)),
    });

    if (!igAccount) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const authAccount = await db.query.account.findFirst({
      where: and(eq(account.userId, igAccount.userId), eq(account.providerId, "instagram")),
    });

    const accessToken = authAccount?.accessToken || undefined;
    if (!accessToken) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const store = await db.query.stores.findFirst({
      where: eq(stores.tenantId, igAccount.tenantId),
    });

    if (!store) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const mediaRes = await fetch(
      `https://graph.instagram.com/${mediaId}?fields=id,caption,media_type,media_url,thumbnail_url,permalink,children{id,media_type,media_url,thumbnail_url}&access_token=${accessToken}`
    );

    const mediaJson = (await mediaRes.json()) as unknown;
    const mediaObj = asObject(mediaJson);

    if (!mediaRes.ok || mediaObj?.error) {
      return NextResponse.json({ ok: true }, { status: 200 });
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
      return NextResponse.json({ ok: true }, { status: 200 });
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
        const copied = await copyToBlob({
          tenantId: igAccount.tenantId,
          sourceUrl: childUrl,
          preferredBasename: childId,
          fallbackContentType: contentType,
        });
        const [mediaRow] = await db
          .insert(mediaObjects)
          .values({
            tenantId: igAccount.tenantId,
            blobUrl: copied.url,
            blobPathname: copied.pathname,
            contentType: copied.contentType,
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
        const copied = await copyToBlob({
          tenantId: igAccount.tenantId,
          sourceUrl: mediaUrl,
          preferredBasename: sourceId,
          fallbackContentType: contentType,
        });
        const [mediaRow] = await db
          .insert(mediaObjects)
          .values({
            tenantId: igAccount.tenantId,
            blobUrl: copied.url,
            blobPathname: copied.pathname,
            contentType: copied.contentType,
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

  return NextResponse.json({ ok: true }, { status: 200 });
}
