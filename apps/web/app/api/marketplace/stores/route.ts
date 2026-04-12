import { marketplaceService } from "@/modules/marketplace";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess } from "@/shared/lib/api/response-utils";

/**
 * GET /api/marketplace/stores
 * Get all active stores with their categories (public)
 */
export const GET = withApi({ auth: false }, async () => {
    const { stores, storesByCategory } = await marketplaceService.getHomePageData();
    return jsonSuccess({ stores, storesByCategory });
});
