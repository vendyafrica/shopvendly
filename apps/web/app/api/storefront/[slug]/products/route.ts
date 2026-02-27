import { NextRequest, NextResponse } from "next/server";

import { storefrontService } from "@/features/storefront/lib/storefront-service";



type RouteParams = {

    params: Promise<{ slug: string }>;

};



type ProductMedia = {
    media?: { ufsUrl?: string | null; url?: string | null; blobUrl?: string | null; contentType?: string | null } | null;
};



type StorefrontProduct = {

    id: string;

    slug: string | null;

    productName: string;

    priceAmount: unknown;

    currency: string;

    media?: ProductMedia[];

    rating?: number;
    ratingCount?: number;
};



/**

 * GET /api/storefront/[slug]/products

 * Returns store products list

 */

export async function GET(request: NextRequest, { params }: RouteParams) {

    try {

        const { slug } = await params;

        const { searchParams } = new URL(request.url);

        const q = (searchParams.get("q") || "").trim();

        const category = (searchParams.get("category") || "").trim();

        const store = await storefrontService.findStoreBySlug(slug);



        if (!store) {

            return NextResponse.json({ error: "Store not found" }, { status: 404 });

        }



        const productList = category

            ? await storefrontService.getStoreProductsByCategorySlug(store.id, category, q)

            : await storefrontService.getStoreProducts(store.id, q);



        return NextResponse.json(

            (productList as StorefrontProduct[]).map((product) => ({

                id: product.id,

                slug: product.slug || product.productName.toLowerCase().replace(/\s+/g, "-"),

                name: product.productName,

                price: Number(product.priceAmount || 0),

                currency: product.currency,

                image:
                    product.media?.[0]?.media?.ufsUrl
                    ?? product.media?.[0]?.media?.url
                    ?? product.media?.[0]?.media?.blobUrl
                    ?? null,

                contentType: product.media?.[0]?.media?.contentType ?? null,

                rating: 0,

            }))

        );

    } catch (error) {

        console.error("Error fetching products:", error);

        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });

    }

}

