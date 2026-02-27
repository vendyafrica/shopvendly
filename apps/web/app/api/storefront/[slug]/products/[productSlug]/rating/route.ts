import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";
import { db, products, productRatings, eq, sql } from "@shopvendly/db";
import { storefrontService } from "@/features/storefront/lib/storefront-service";

interface RouteParams {
    params: Promise<{ slug: string; productSlug: string }>;
}

type RatingBody = {
    rating?: number;
};

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
        await db
            .insert(productRatings)
            .values({
                productId: product.id,
                userId: session.user.id,
                rating: value,
            })
            .onConflictDoUpdate({
                target: [productRatings.productId, productRatings.userId],
                set: {
                    rating: value,
                    updatedAt: new Date(),
                },
            });

        // Recalculate aggregates
        const aggregates = await db
            .select({
                average: sql<number>`avg(${productRatings.rating})`,
                count: sql<number>`count(${productRatings.id})`,
            })
            .from(productRatings)
            .where(eq(productRatings.productId, product.id));

        const avg = aggregates[0]?.average ? Number(aggregates[0].average) : 0;
        const count = aggregates[0]?.count ? Number(aggregates[0].count) : 0;

        // Persist snapshot on product row for any legacy consumers
        await db
            .update(products)
            .set({
                rating: Math.round(avg),
                ratingCount: count,
            })
            .where(eq(products.id, product.id));

        return NextResponse.json({
            success: true,
            rating: avg || 0,
            ratingCount: count || 0,
            userRating: value,
        });
    } catch (error) {
        console.error("Error saving rating:", error);
        return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
    }
}
