import { marketplaceService } from "@/modules/marketplace";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess } from "@/lib/api/response-utils";

/**
 * GET /api/marketplace/categories/[slug]/stores
 * Get stores for a specific category (public)
 */
export const GET = withApi<undefined, { slug: string }>({ auth: false }, async ({ params }) => {
    const stores = await marketplaceService.getStoresBySpecificCategory(params.slug);
    return jsonSuccess({ stores });
});
