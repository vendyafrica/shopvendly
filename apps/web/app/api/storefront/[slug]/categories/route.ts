import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/features/storefront/lib/storefront-service";

type RouteParams = {
    params: Promise<{ slug: string }>;
};

/**
 * GET /api/storefront/[slug]/categories
 * Returns store categories
 */
type Category = {
    slug: string;
    name: string;
    image: string | null;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;
        const store = await storefrontService.findStoreBySlug(slug);

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Categories are stored as string[] in store
        const categories: Category[] = (store.categories ?? []).map((name: string) => ({
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
