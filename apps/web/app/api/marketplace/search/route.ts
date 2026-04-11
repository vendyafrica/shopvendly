import { marketplaceService } from "@/modules/marketplace";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess } from "@/lib/api/response-utils";

/**
 * GET /api/marketplace/search?q=term
 * Public marketplace text search across stores and products
 */
export const GET = withApi({ auth: false }, async ({ req }) => {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const storeLimit = Number(searchParams.get("storeLimit") || "") || undefined;
    const productLimit = Number(searchParams.get("productLimit") || "") || undefined;
    const includeDescriptions = searchParams.get("includeDescriptions") === "true";

    if (!q) return jsonSuccess({ stores: [], products: [] });

    const result = await marketplaceService.searchMarketplace(q, { storeLimit, productLimit, includeDescriptions });
    return jsonSuccess(result);
});
