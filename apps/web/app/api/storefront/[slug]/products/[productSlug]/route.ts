import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { storefrontService } from "@/modules/storefront";
import { productRatingsRepo } from "@/modules/products/repo/product-ratings-repo";
import { jsonSuccess, jsonError } from "@/shared/lib/api/response-utils";

/**
 * GET /api/storefront/[slug]/products/[productSlug]
 * Returns a single product by slug (public, but optionally enriched with user rating)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string; productSlug: string }> }) {
    try {
        const { slug, productSlug } = await params;
        const session = await auth.api.getSession({ headers: await headers() });

        const store = await storefrontService.findStoreBySlug(slug);
        if (!store) return jsonError("Store not found", 404);

        const product = await storefrontService.getStoreProductBySlug(store.id, productSlug);
        if (!product) return jsonError("Product not found", 404);

        let userRating: number | null = null;
        if (session?.user?.id) {
            const existing = await productRatingsRepo.findByProductAndUser(product.id, session.user.id);
            userRating = existing?.rating ?? null;
        }

        return jsonSuccess({
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
            store: { id: store.id, name: store.name, slug: store.slug },
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        return jsonError("Failed to fetch product", 500);
    }
}
