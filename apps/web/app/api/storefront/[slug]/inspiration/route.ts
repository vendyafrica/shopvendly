import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/features/storefront/lib/storefront-service";
import { db } from "@shopvendly/db/db";
import { sql } from "@shopvendly/db";

const VIDEO_FIELDS = [
  "id",
  "title",
  "video_description",
  "duration",
  "cover_image_url",
  "embed_link",
  "share_url",
].join(",");

type RouteParams = {
  params: Promise<{ slug: string }>;
};

type TikTokError = {
  code?: string;
  message?: string;
  log_id?: string;
};

type TikTokVideo = {
  id: string;
  title?: string;
  video_description?: string;
  duration?: number;
  cover_image_url?: string;
  embed_link?: string;
  share_url?: string;
};

type TikTokVideoListResponse = {
  data?: {
    videos?: TikTokVideo[];
    cursor?: number;
    has_more?: boolean;
  };
  error?: TikTokError;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const store = await storefrontService.findStoreBySlug(slug);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const linkedResult = await db.execute(sql`
      select user_id, display_name, username, avatar_url
      from tiktok_accounts
      where store_id = ${store.id}
        and tenant_id = ${store.tenantId}
        and is_active = true
      limit 1
    `);

    const linkedTikTok = (linkedResult.rows?.[0] ?? null) as
      | {
          user_id: string;
          display_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
        }
      | null;

    if (!linkedTikTok?.user_id) {
      return NextResponse.json({ connected: false, videos: [] });
    }

    const linkedAuthResult = await db.execute(sql`
      select access_token
      from account
      where user_id = ${linkedTikTok.user_id}
        and provider_id = 'tiktok'
      limit 1
    `);

    const linkedAuthAccount = (linkedAuthResult.rows?.[0] ?? null) as
      | { access_token?: string | null }
      | null;

    if (!linkedAuthAccount?.access_token) {
      return NextResponse.json({ connected: false, videos: [] });
    }

    const { searchParams } = new URL(request.url);
    const maxCountParam = Number(searchParams.get("maxCount") || "12");
    const maxCount = Number.isFinite(maxCountParam)
      ? Math.min(Math.max(maxCountParam, 1), 20)
      : 12;

    const response = await fetch(
      `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(VIDEO_FIELDS)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${linkedAuthAccount.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ max_count: maxCount }),
        cache: "no-store",
      }
    );

    const text = await response.text();
    let result: TikTokVideoListResponse;
    try {
      result = JSON.parse(text) as TikTokVideoListResponse;
    } catch {
      return NextResponse.json({ error: "TikTok returned non-JSON inspiration response" }, { status: 502 });
    }

    if (!response.ok || (result.error?.code && result.error.code !== "ok")) {
      return NextResponse.json(
        {
          error: result.error?.message || "Failed to fetch TikTok inspiration feed",
          code: result.error?.code || "tiktok_inspiration_error",
          upstreamStatus: response.status,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      connected: true,
      profile: {
        displayName: linkedTikTok.display_name,
        username: linkedTikTok.username,
        avatarUrl: linkedTikTok.avatar_url,
      },
      videos: result.data?.videos ?? [],
      cursor: result.data?.cursor ?? null,
      hasMore: Boolean(result.data?.has_more),
    });
  } catch (error) {
    console.error("Storefront TikTok inspiration error:", error);
    return NextResponse.json({ connected: false, videos: [] }, { status: 500 });
  }
}
