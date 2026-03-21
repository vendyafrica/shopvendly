import { NextResponse } from "next/server";
import { marketplaceService } from "@/modules/marketplace";

/**
 * GET /api/marketplace/stores
 * Get all active stores with their categories
 */
export async function GET() {
    try {
        const { stores, storesByCategory } = await marketplaceService.getHomePageData();

        return NextResponse.json({
            stores,
            storesByCategory,
        });
    } catch (error) {
        console.error("Error fetching marketplace stores:", error);
        return NextResponse.json(
            { error: "Failed to fetch stores" },
            { status: 500 }
        );
    }
}
