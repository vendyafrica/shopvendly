import { marketplaceService } from "@/modules/marketplace/services/marketplace-service";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/shared/lib/api/response-utils";

export const dynamic = "force-dynamic";

export const GET = withApi({ auth: false }, async () => {
    if (process.env.NEXT_PUBLIC_DEBUG_ENABLED !== "true") {
        throw new HttpError("Not found", 404);
    }

    const data = await marketplaceService.getHomePageData();
    return jsonSuccess({
        storeCount: data.stores.length,
        stores: data.stores.map((s) => ({
            id: s.id,
            name: s.name,
            heroMedia: s.heroMedia,
            images: s.images,
            logoUrl: s.logoUrl,
        })),
    });
});
