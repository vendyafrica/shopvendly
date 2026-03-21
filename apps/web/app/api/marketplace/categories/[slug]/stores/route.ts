import { NextRequest, NextResponse } from "next/server";
import { marketplaceService } from "@/modules/marketplace";

import { type MarketplaceCategoryRouteParams as RouteParams } from "@/models";

/**
 * GET /api/marketplace/categories/[slug]/stores
 * Get stores for a specific category
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;
        const stores = await marketplaceService.getStoresBySpecificCategory(slug);

        return NextResponse.json({ stores });
    } catch (error) {
        console.error("Error fetching category stores:", error);
        return NextResponse.json(
            { error: "Failed to fetch stores" },
            { status: 500 }
        );
    }
}
