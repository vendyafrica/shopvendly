import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/features/storefront/lib/storefront-service";

const DEFAULT_STORE_LOGO = "/store-logo.jpg";

type RouteParams = {
    params: Promise<{ slug: string }>;
};

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

        return NextResponse.json({
            id: store.id,
            tenantId: store.tenantId,
            name: store.name,
            slug: store.slug,
            description: store.description,
            logoUrl: store.logoUrl ?? DEFAULT_STORE_LOGO,
            heroMedia: store.heroMedia,
            categories: (store as { categories?: string[] }).categories ?? [],
            rating: rating.rating,
            ratingCount: rating.ratingCount,
        });
    } catch (error) {
        console.error("Error fetching store data:", error);
        return NextResponse.json({ error: "Failed to fetch store data" }, { status: 500 });
    }
}
