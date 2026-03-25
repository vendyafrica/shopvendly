import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";
import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/modules/storefront";
import { productRatingsRepo } from "@/repo/product-ratings-repo";
import type { StorefrontProductRouteParams } from "@/models/storefront";



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
            slug: product.slug || product.name.toLowerCase().replace(/\s+/g, "-"),
            name: product.name,
            description: product.description,
            price: Number(product.price || 0),
            originalPrice: product.originalPrice ?? null,
            currency: product.currency,
            availableQuantity: (product as { quantity?: number })?.quantity ?? null,
            variants: (product as { variants?: unknown })?.variants ?? null,
            images: Array.isArray(product.images) ? product.images : [],
            mediaItems: Array.isArray(product.mediaItems) ? product.mediaItems : [],
            rating: product.averageRating ?? 0,
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

