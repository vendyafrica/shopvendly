import { NextRequest, NextResponse } from "next/server";

import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";
import { db, eq, and, productRatings } from "@shopvendly/db";
import { storefrontService } from "@/features/storefront/lib/storefront-service";



type RouteParams = {

    params: Promise<{ slug: string; productSlug: string }>;

};



type ProductMedia = {
    media?: {
        blobUrl?: string | null;
        blobPathname?: string | null;
        contentType?: string | null;
    } | null;
};



type StorefrontProduct = {

    id: string;

    slug: string | null;

    productName: string;

    description: string | null;

    priceAmount: unknown;

    currency: string;

    quantity?: number | null;

    media?: ProductMedia[];

    styleGuideEnabled?: boolean | null;

    styleGuideType?: string | null;

    rating?: number;
    ratingCount?: number;
};

function resolveMediaUrl(entry?: ProductMedia | null): string | null {
    if (!entry?.media) return null;

    const { blobUrl, blobPathname } = entry.media;

    if (blobUrl) return blobUrl;

    if (!blobPathname) return null;
    if (/^https?:\/\//i.test(blobPathname)) return blobPathname;

    return `https://utfs.io/f/${blobPathname.replace(/^\/+/, "")}`;
}



/**

 * GET /api/storefront/[slug]/products/[productSlug]

 * Returns a single product by slug

 */

export async function GET(request: NextRequest, { params }: RouteParams) {

    try {

        const { slug, productSlug } = await params;

        const store = await storefrontService.findStoreBySlug(slug);

        const headerList = await headers();
        const session = await auth.api.getSession({ headers: headerList });


        if (!store) {

            return NextResponse.json({ error: "Store not found" }, { status: 404 });

        }



        const product = await storefrontService.getStoreProductBySlug(store.id, productSlug) as StorefrontProduct | undefined;



        if (!product) {

            return NextResponse.json({ error: "Product not found" }, { status: 404 });

        }


        let userRating: number | null = null;

        if (session?.user?.id) {
            const existing = await db.query.productRatings.findFirst({
                where: and(
                    eq(productRatings.productId, product.id),
                    eq(productRatings.userId, session.user.id)
                ),
            });
            userRating = existing?.rating ?? null;
        }


        return NextResponse.json({
            id: product.id,
            slug: product.slug || product.productName.toLowerCase().replace(/\s+/g, "-"),
            name: product.productName,
            description: product.description,
            price: Number(product.priceAmount || 0),
            currency: product.currency,
            availableQuantity: (product as { quantity?: number })?.quantity ?? 0,
            styleGuideEnabled: Boolean(product.styleGuideEnabled),
            styleGuideType: product.styleGuideType ?? "clothes",
            images: (product.media ?? [])
                .map((m) => resolveMediaUrl(m))
                .filter(Boolean),
            mediaItems: (product.media ?? [])
                .map((m) => ({
                    url: resolveMediaUrl(m),
                    contentType: m.media?.contentType ?? null,
                }))
                .filter((m) => Boolean(m.url)),
            rating: 0,
            userRating,
            store: {
                id: store.id,
                name: store.name,
                slug: store.slug,
            },
        });

    } catch (error) {

        console.error("Error fetching product:", error);

        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });

    }

}

