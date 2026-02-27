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

type TikTokVideoQueryResponse = {
  data?: {
    videos?: Array<Record<string, unknown>>;
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
      videoIds?: string[];
    };

    const videoIds = Array.isArray(body.videoIds)
      ? body.videoIds.filter((value) => typeof value === "string" && value.length > 0).slice(0, 20)
      : [];

    if (videoIds.length === 0) {
      return NextResponse.json({ error: "videoIds is required" }, { status: 400 });
    }

    const response = await fetch(
      `https://open.tiktokapis.com/v2/video/query/?fields=${encodeURIComponent(VIDEO_FIELDS)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tiktokAccount.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: {
            video_ids: videoIds,
          },
        }),
        cache: "no-store",
      }
    );

    const text = await response.text();
    let result: TikTokVideoQueryResponse;
    try {
      result = JSON.parse(text) as TikTokVideoQueryResponse;
    } catch {
      return NextResponse.json({ error: "TikTok returned non-JSON video query response" }, { status: 502 });
    }

    if (!response.ok || (result.error?.code && result.error.code !== "ok")) {
      return NextResponse.json(
        {
          error: result.error?.message || "Failed to query TikTok videos",
          code: result.error?.code || "tiktok_videos_query_error",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      videos: result.data?.videos ?? [],
    });
  } catch (error) {
    console.error("TikTok video query error:", error);
    return NextResponse.json({ error: "Failed to query TikTok videos" }, { status: 500 });
  }
}
