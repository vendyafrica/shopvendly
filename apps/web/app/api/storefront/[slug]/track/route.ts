import { NextRequest, NextResponse } from "next/server";
import { storefrontTrackingRepo } from "@/repo/storefront-tracking-repo";
import type { StorefrontRouteParams, StorefrontTrackRequestBody } from "@/models/storefront";

export async function POST(request: NextRequest, { params }: StorefrontRouteParams) {
  try {
    const { slug } = await params;

    const store = await storefrontTrackingRepo.findStoreIdentityBySlug(slug);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as StorefrontTrackRequestBody | null;

    if (!body?.sessionId || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || undefined;
    await storefrontTrackingRepo.recordSessionAndEvents(store, body, userAgent);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error tracking storefront event:", error);
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
