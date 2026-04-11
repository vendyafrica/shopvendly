import { z } from "zod";
import { storefrontService } from "@/modules/storefront";
import { productRatingsRepo } from "@/repo/product-ratings-repo";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/lib/api/response-utils";

const ratingSchema = z.object({
    rating: z.number().int().min(1).max(5),
});

export const POST = withApi({ schema: ratingSchema }, async ({ session, params, body }) => {
    const { slug, productSlug } = params as { slug: string; productSlug: string };

    const store = await storefrontService.findStoreBySlug(slug);
    if (!store) throw new HttpError("Store not found", 404);

    const product = await storefrontService.getStoreProductBySlug(store.id, productSlug);
    if (!product) throw new HttpError("Product not found", 404);

    await productRatingsRepo.upsertProductRating(product.id, session.user.id, body.rating);

    const aggregates = await productRatingsRepo.getProductRatingAggregate(product.id);
    await productRatingsRepo.syncProductRatingSnapshot(product.id, aggregates.rating, aggregates.ratingCount);

    return jsonSuccess({
        success: true,
        rating: aggregates.rating || 0,
        ratingCount: aggregates.ratingCount || 0,
        userRating: body.rating,
    });
});
