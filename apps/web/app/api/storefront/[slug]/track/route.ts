import { NextRequest } from "next/server";
import { storefrontTrackingRepo } from "@/modules/storefront/repo/storefront-tracking-repo";
import type { StorefrontTrackRequestBody } from "@/modules/storefront/types";
import { jsonSuccess, jsonError } from "@/shared/lib/api/response-utils";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const store = await storefrontTrackingRepo.findStoreIdentityBySlug(slug);
    if (!store) return jsonError("Store not found", 404);

    const body = (await request.json().catch(() => null)) as StorefrontTrackRequestBody | null;
    if (!body?.sessionId || !Array.isArray(body.events) || body.events.length === 0) {
      return jsonError("Invalid payload", 400);
    }

    const userAgent = request.headers.get("user-agent") || undefined;
    await storefrontTrackingRepo.recordSessionAndEvents(store, body, userAgent);
    return jsonSuccess({ ok: true });
  } catch (error) {
    console.error("Error tracking storefront event:", error);
    return jsonError("Failed to track", 500);
  }
}
