import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";
import { storefrontService } from "@/modules/storefront";
import { productRatingsRepo } from "@/repo/product-ratings-repo";

import { type ProductRatingRouteParams as RouteParams, type RatingBody } from "@/models";

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug, productSlug } = await params;
        const headerList = await headers();
        const session = await auth.api.getSession({ headers: headerList });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as RatingBody;
        const value = Number(body.rating);

        if (!Number.isFinite(value) || value < 1 || value > 5) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
        }

        const store = await storefrontService.findStoreBySlug(slug);
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const product = await storefrontService.getStoreProductBySlug(store.id, productSlug);
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Upsert user rating
        await productRatingsRepo.upsertProductRating(product.id, session.user.id, value);

        const aggregates = await productRatingsRepo.getProductRatingAggregate(product.id);
        await productRatingsRepo.syncProductRatingSnapshot(product.id, aggregates.rating, aggregates.ratingCount);

        return NextResponse.json({
            success: true,
            rating: aggregates.rating || 0,
            ratingCount: aggregates.ratingCount || 0,
            userRating: value,
        });
    } catch (error) {
        console.error("Error saving rating:", error);
        return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
    }
}
