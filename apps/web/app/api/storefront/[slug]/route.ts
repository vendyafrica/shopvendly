import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/app/[handle]/lib/storefront-service";

const DEFAULT_STORE_LOGO = "/vendly.png";

type RouteParams = {
    params: Promise<{ slug: string }>;
};

function toCanonicalUploadThingUrl(rawUrl: string) {
    try {
        const parsed = new URL(rawUrl);
        const fileId = parsed.pathname.split("/").filter(Boolean).pop();
        if (!fileId) return rawUrl;

        const isUploadThingHost = parsed.hostname.endsWith(".ufs.sh") || parsed.hostname === "utfs.io";
        if (!isUploadThingHost) return rawUrl;

        return `https://utfs.io/f/${fileId}`;
    } catch {
        return rawUrl;
    }
}

function normalizeMediaUrls(urls: unknown): string[] {
    if (!Array.isArray(urls)) return [];

    return urls
        .filter((url): url is string => typeof url === "string" && url.length > 0)
        .map((url) => toCanonicalUploadThingUrl(url));
}

/**
 * GET /api/storefront/[slug]
 * Returns store header/hero data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;
        const store = await storefrontService.findStoreBySlug(slug);

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const rating = await storefrontService.getStoreRatingAggregate(store.id);

        const normalizedLogo = typeof store.logoUrl === "string"
            ? toCanonicalUploadThingUrl(store.logoUrl)
            : undefined;

        // Some Instagram-hosted avatars return 403; prefer a safe local fallback in that case.
        const logoUrl = normalizedLogo && !/cdninstagram\.com/i.test(normalizedLogo)
            ? normalizedLogo
            : DEFAULT_STORE_LOGO;
        const heroMedia = normalizeMediaUrls(store.heroMedia);

        return NextResponse.json({
            id: store.id,
            tenantId: store.tenantId,
            name: store.name,
            slug: store.slug,
            description: store.description,
            logoUrl,
            heroMedia,
            categories: (store as { categories?: string[] }).categories ?? [],
            rating: rating.rating,
            ratingCount: rating.ratingCount,
        });
    } catch (error) {
        console.error("Error fetching store data:", error);
        return NextResponse.json({ error: "Failed to fetch store data" }, { status: 500 });
    }
}
