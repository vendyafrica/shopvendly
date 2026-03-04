import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/app/[handle]/lib/storefront-service";
import { db } from "@shopvendly/db/db";
import { sql } from "@shopvendly/db";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

type TikTokVideo = {
  id: string;
  title?: string;
  video_description?: string;
  duration?: number;
  cover_image_url?: string;
  embed_link?: string;
  share_url?: string;
  created_at?: string;
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

    if (!linkedTikTok) {
      return NextResponse.json({ connected: false, videos: [] });
    }

    const { searchParams } = new URL(request.url);
    const maxCountParam = Number(searchParams.get("maxCount") || "25");
    const maxCount = Number.isFinite(maxCountParam)
      ? Math.min(Math.max(maxCountParam, 1), 25)
      : 25;

    const postsResult = await db.execute(sql`
      select
        source_post_id,
        title,
        video_description,
        duration,
        cover_image_url,
        embed_link,
        share_url,
        created_at_source,
        sort_order
      from tiktok_posts
      where store_id = ${store.id}
        and tenant_id = ${store.tenantId}
      order by sort_order asc, created_at_source desc nulls last
      limit ${maxCount}
    `);

    const videos = (postsResult.rows ?? []) as Array<{
      source_post_id: string;
      title?: string | null;
      video_description?: string | null;
      duration?: number | null;
      cover_image_url?: string | null;
      embed_link?: string | null;
      share_url?: string | null;
      created_at_source?: Date | string | null;
    }>;

    if (!videos.length) {
      return NextResponse.json({ connected: false, videos: [] });
    }

    return NextResponse.json({
      connected: true,
      profile: {
        displayName: linkedTikTok.display_name,
        username: linkedTikTok.username,
        avatarUrl: linkedTikTok.avatar_url,
      },
      videos: videos.map(
        (video): TikTokVideo => ({
          id: video.source_post_id,
          title: video.title ?? undefined,
          video_description: video.video_description ?? undefined,
          duration: video.duration ?? undefined,
          cover_image_url: video.cover_image_url ?? undefined,
          embed_link: video.embed_link ?? undefined,
          share_url: video.share_url ?? undefined,
          created_at: video.created_at_source ? new Date(video.created_at_source).toISOString() : undefined,
        })
      ),
      cursor: null,
      hasMore: false,
    });
  } catch (error) {
    console.error("Storefront TikTok inspiration error:", error);
    return NextResponse.json({ connected: false, videos: [] }, { status: 500 });
  }
}
