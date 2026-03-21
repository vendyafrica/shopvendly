import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/modules/storefront";
import type { StorefrontCategory, StorefrontRouteParams } from "@/models/storefront";

/**
 * GET /api/storefront/[slug]/categories
 * Returns store categories
 */
export async function GET(request: NextRequest, { params }: StorefrontRouteParams) {
    try {
        const { slug } = await params;
        const store = await storefrontService.findStoreBySlug(slug);

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Categories are stored as string[] in store
        const categories: StorefrontCategory[] = (store.categories ?? []).map((name: string) => ({
            slug: name.toLowerCase().replace(/\s+/g, "-"),
            name,
            image: null,
        }));

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}
