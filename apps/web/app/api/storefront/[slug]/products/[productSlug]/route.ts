import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";
import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/modules/storefront/data";
import { productRatingsRepo } from "@/repo/product-ratings-repo";
import type { StorefrontProductRouteParams, StorefrontProductMedia } from "@/models/storefront";

function resolveMediaUrl(entry?: StorefrontProductMedia | null): string | null {
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

export async function GET(request: NextRequest, { params }: StorefrontProductRouteParams) {

    try {

        const { slug, productSlug } = await params;

        const store = await storefrontService.findStoreBySlug(slug);

        const headerList = await headers();
        const session = await auth.api.getSession({ headers: headerList });


        if (!store) {

            return NextResponse.json({ error: "Store not found" }, { status: 404 });

        }



        const product = await storefrontService.getStoreProductBySlug(store.id, productSlug);



        if (!product) {

            return NextResponse.json({ error: "Product not found" }, { status: 404 });

        }


        let userRating: number | null = null;

        if (session?.user?.id) {
            const existing = await productRatingsRepo.findByProductAndUser(product.id, session.user.id);
            userRating = existing?.rating ?? null;
        }


        return NextResponse.json({
            id: product.id,
            slug: product.slug || product.productName.toLowerCase().replace(/\s+/g, "-"),
            name: product.productName,
            description: product.description,
            price: Number(product.priceAmount || 0),
            originalPrice: Number(product.originalPriceAmount || 0) > Number(product.priceAmount || 0)
                ? Number(product.originalPriceAmount || 0)
                : null,
            currency: product.currency,
            availableQuantity: (product as { quantity?: number })?.quantity ?? 0,
            variants: product.variants ?? null,
            images: (product.media ?? [])
                .map((m) => resolveMediaUrl(m))
                .filter(Boolean),
            mediaItems: (product.media ?? [])
                .map((m) => ({
                    url: resolveMediaUrl(m),
                    contentType: m.media?.contentType ?? null,
                }))
                .filter((m) => Boolean(m.url)),
            rating: product.rating ?? 0,
            ratingCount: product.ratingCount ?? 0,
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

