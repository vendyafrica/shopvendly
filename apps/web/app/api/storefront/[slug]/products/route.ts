import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/modules/storefront";
import type { StorefrontProductVariantSummary, StorefrontProductsRouteParams } from "@/models/storefront";

/**

 * GET /api/storefront/[slug]/products

 * Returns store products list

 */

export async function GET(request: NextRequest, { params }: StorefrontProductsRouteParams) {

    try {

        const { slug } = await params;

        const { searchParams } = new URL(request.url);

        const q = (searchParams.get("q") || "").trim();

        const collection = (searchParams.get("collection") || searchParams.get("category") || "").trim();

        const section = (searchParams.get("section") || "").trim().toLowerCase();

        const store = await storefrontService.findStoreBySlug(slug);

        if (!store) {

            return NextResponse.json({ error: "Store not found" }, { status: 404 });

        }

        const fetchedProducts = collection
            ? await storefrontService.getStoreProductsByCollectionSlug(store.id, collection, q)
            : await storefrontService.getStoreProducts(store.id, q);

        let productList = fetchedProducts;

        if (section === "sale") {
            productList = productList.filter((product) => {
                const livePrice = Number(product.price || 0);
                const originalPrice = Number(product.originalPrice || 0);
                return originalPrice > livePrice && livePrice >= 0;
            });
        }

        if (section === "new-arrivals") {
            productList = [...productList]
                .sort((a, b) => new Date(String(b.createdAt ?? 0)).getTime() - new Date(String(a.createdAt ?? 0)).getTime())
                .slice(0, 12);
        }

        return NextResponse.json(
            productList.map((product) => {
                const price = Number(product.price || 0);
                const originalPrice = Number(product.originalPrice || 0);
                const hasSale = originalPrice > price;
                const discountPercent = hasSale && originalPrice > 0
                    ? Math.round(((originalPrice - price) / originalPrice) * 100)
                    : null;

                const variantSummary: StorefrontProductVariantSummary = product.variantSummary ?? {
                    hasColors: false,
                    hasSizes: false,
                };

                return {
                    id: product.id,
                    slug: product.slug || product.name.toLowerCase().replace(/\s+/g, "-"),
                    name: product.name,
                    price,
                    originalPrice: hasSale ? originalPrice : null,
                    hasSale,
                    discountPercent,
                    currency: product.currency,
                    image: product.image ?? null,
                    contentType: product.contentType ?? null,
                    variantSummary,
                    averageRating: product.averageRating ?? 0,
                    ratingCount: product.ratingCount ?? 0,
                };
            })
        );

    } catch (error) {

        console.error("Error fetching products:", error);

        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });

    }

}
