import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-utils";
import { instagramSyncSchema } from "@/models";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, limit } = instagramSyncSchema.parse(body);

    const apiBase = getApiBaseUrl();

    if (!apiBase) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_API_URL; cannot reach Express API for Instagram sync." },
        { status: 500 }
      );
    }

    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (!internalApiKey) {
      return NextResponse.json(
        { error: "Missing INTERNAL_API_KEY; cannot call internal Instagram sync endpoint." },
        { status: 500 }
      );
    }

    const endpoint = limit ? "sync-posts" : "sync";
    const response = await fetch(`${apiBase}/api/internal/instagram/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": internalApiKey,
      },
      body: JSON.stringify({
        storeId,
        userId: session.user.id,
        limit,
      }),
      cache: "no-store",
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(json || { error: "Instagram sync failed" }, { status: response.status });
    }

    return NextResponse.json(json, { status: 200 });
  } catch (error) {
    console.error("Instagram sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
