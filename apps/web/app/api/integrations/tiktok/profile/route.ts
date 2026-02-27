import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { account } from "@shopvendly/db/schema";
import { and, eq } from "@shopvendly/db";

const USER_INFO_FIELDS = [
  "open_id",
  "union_id",
  "avatar_url",
  "display_name",
  "bio_description",
  "profile_deep_link",
  "username",
].join(",");

type TikTokError = {
  code?: string;
  message?: string;
  log_id?: string;
};

type TikTokProfileResponse = {
  data?: {
    user?: Record<string, unknown>;
  };
  error?: TikTokError;
};

export async function GET() {
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

    const response = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(USER_INFO_FIELDS)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tiktokAccount.accessToken}`,
        },
        cache: "no-store",
      }
    );

    const text = await response.text();
    let payload: TikTokProfileResponse;
    try {
      payload = JSON.parse(text) as TikTokProfileResponse;
    } catch {
      return NextResponse.json({ error: "TikTok returned non-JSON profile response" }, { status: 502 });
    }

    if (!response.ok || (payload.error?.code && payload.error.code !== "ok")) {
      return NextResponse.json(
        {
          error: payload.error?.message || "Failed to fetch TikTok profile",
          code: payload.error?.code || "tiktok_profile_error",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      user: payload.data?.user ?? null,
    });
  } catch (error) {
    console.error("TikTok profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch TikTok profile" }, { status: 500 });
  }
}
