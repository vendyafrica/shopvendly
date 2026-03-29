import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/modules/storefront";
import type { StorefrontStoreRouteParams } from "@/models/storefront";
import { DEFAULT_STORE_LOGO } from "@/lib/constants/defaults";
import { normalizeMediaUrls, toCanonicalUploadThingUrl } from "@/lib/media";

/**
 * GET /api/storefront/[slug]
 * Returns store header/hero data
 */
export async function GET(request: NextRequest, { params }: StorefrontStoreRouteParams) {
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
            storePolicy: store.storePolicy,
            collectoPassTransactionFeeToCustomer: Boolean((store as { collectoPassTransactionFeeToCustomer?: boolean }).collectoPassTransactionFeeToCustomer),
            collectoPayoutMode: (store as { collectoPayoutMode?: string }).collectoPayoutMode === "manual_batch"
                ? "manual_batch"
                : "automatic_per_order",
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
