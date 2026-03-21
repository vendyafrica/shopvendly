import { NextRequest, NextResponse } from "next/server";
import { marketplaceService } from "@/modules/marketplace";

/**
 * GET /api/marketplace/search?q=term&storeLimit=&productLimit=&includeDescriptions=
 * Public marketplace text search across stores and products
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const q = (searchParams.get("q") || "").trim();
        const storeLimit = Number(searchParams.get("storeLimit") || "") || undefined;
        const productLimit = Number(searchParams.get("productLimit") || "") || undefined;
        const includeDescriptions = searchParams.get("includeDescriptions") === "true";

        if (!q) {
            return NextResponse.json({ stores: [], products: [] });
        }

        const result = await marketplaceService.searchMarketplace(q, {
            storeLimit,
            productLimit,
            includeDescriptions,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error searching marketplace:", error);
        return NextResponse.json({ error: "Failed to search marketplace" }, { status: 500 });
    }
}
