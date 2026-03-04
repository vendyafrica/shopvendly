import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint. TikTok videos are now imported via /api/integrations/tiktok/sync.",
    },
    { status: 410 }
  );
}
