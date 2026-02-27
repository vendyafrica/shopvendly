import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { account } from "@shopvendly/db/schema";
import { and, eq } from "@shopvendly/db";

const VIDEO_FIELDS = [
  "id",
  "title",
  "video_description",
  "duration",
  "cover_image_url",
  "embed_link",
  "share_url",
].join(",");

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

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tiktokAccount = await db.query.account.findFirst({
      where: and(eq(account.userId, session.user.id), eq(account.providerId, "tiktok")),
      columns: {
        accessToken: true,
      },
    });

    if (!tiktokAccount?.accessToken) {
      return NextResponse.json({ error: "TikTok not connected" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      cursor?: number;
      maxCount?: number;
    };

    const maxCount = Number.isFinite(body.maxCount)
      ? Math.min(Math.max(Number(body.maxCount), 1), 20)
      : 12;

    const payload = {
      max_count: maxCount,
      ...(Number.isFinite(body.cursor) ? { cursor: Number(body.cursor) } : {}),
    };

    const response = await fetch(
      `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(VIDEO_FIELDS)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tiktokAccount.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const text = await response.text();
    let result: TikTokVideoListResponse;
    try {
      result = JSON.parse(text) as TikTokVideoListResponse;
    } catch {
      return NextResponse.json({ error: "TikTok returned non-JSON video response" }, { status: 502 });
    }

    if (!response.ok || (result.error?.code && result.error.code !== "ok")) {
      return NextResponse.json(
        {
          error: result.error?.message || "Failed to fetch TikTok videos",
          code: result.error?.code || "tiktok_videos_error",
          upstreamStatus: response.status,
          logId: result.error?.log_id,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      videos: result.data?.videos ?? [],
      cursor: result.data?.cursor ?? null,
      hasMore: Boolean(result.data?.has_more),
    });
  } catch (error) {
    console.error("TikTok video list error:", error);
    return NextResponse.json({ error: "Failed to fetch TikTok videos" }, { status: 500 });
  }
}
