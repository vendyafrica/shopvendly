import { NextRequest } from "next/server";
import { storefrontService } from "@/modules/storefront";
import { DEFAULT_STORE_LOGO } from "@/shared/lib/constants/defaults";
import { normalizeMediaUrls, toCanonicalUploadThingUrl } from "@/modules/media/services";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/shared/lib/api/response-utils";

/**
 * GET /api/storefront/[slug]
 * Returns store header/hero data (public)
 */
export const GET = withApi<undefined, { slug: string }>({ auth: false }, async ({ params }) => {
    const store = await storefrontService.findStoreBySlug(params.slug);
    if (!store) throw new HttpError("Store not found", 404);

    const rating = await storefrontService.getStoreRatingAggregate(store.id);

    const normalizedLogo = typeof store.logoUrl === "string"
        ? toCanonicalUploadThingUrl(store.logoUrl)
        : undefined;

    const logoUrl = normalizedLogo && !/cdninstagram\.com/i.test(normalizedLogo)
        ? normalizedLogo
        : DEFAULT_STORE_LOGO;
    const heroMedia = normalizeMediaUrls(store.heroMedia);

    return jsonSuccess({
        id: store.id,
        tenantId: store.tenantId,
        name: store.name,
        slug: store.slug,
        description: store.description,
        storePolicy: store.storePolicy,
        collectoPassTransactionFeeToCustomer: Boolean((store as { collectoPassTransactionFeeToCustomer?: boolean }).collectoPassTransactionFeeToCustomer),
        collectoPayoutMode: (store as { collectoPayoutMode?: string }).collectoPayoutMode === "manual_batch"
            ? "manual_batch"
            : "automatic_per_order",
        logoUrl,
        heroMedia,
        categories: (store as { categories?: string[] }).categories ?? [],
        rating: rating.rating,
        ratingCount: rating.ratingCount,
    });
});
