import { storefrontService } from "@/modules/storefront";
import type { StorefrontProductVariantSummary } from "@/modules/storefront/types";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/shared/lib/api/response-utils";

/**
 * GET /api/storefront/[slug]/products
 * Returns store products list (public)
 */
export const GET = withApi<undefined, { slug: string }>({ auth: false }, async ({ req, params }) => {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const collection = (searchParams.get("collection") || searchParams.get("category") || "").trim();
    const section = (searchParams.get("section") || "").trim().toLowerCase();

    const store = await storefrontService.findStoreBySlug(params.slug);
    if (!store) throw new HttpError("Store not found", 404);

    const fetchedProducts = collection
        ? await storefrontService.getStoreProductsByCollectionSlug(store.id, collection, q)
        : await storefrontService.getStoreProducts(store.id, q);

    let productList = fetchedProducts;

    if (section === "sale") {
        productList = productList.filter((p) => {
            const livePrice = Number(p.price || 0);
            const originalPrice = Number(p.originalPrice || 0);
            return originalPrice > livePrice && livePrice >= 0;
        });
    }

    if (section === "new-arrivals") {
        productList = [...productList]
            .sort((a, b) => new Date(String(b.createdAt ?? 0)).getTime() - new Date(String(a.createdAt ?? 0)).getTime())
            .slice(0, 12);
    }

    return jsonSuccess(
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
        }),
    );
});
