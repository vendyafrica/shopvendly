import { marketplaceService } from "@/modules/marketplace/lib/marketplace-service";
import { jsonSuccess, jsonError } from "@/lib/api/response-utils";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
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
    } catch (error) {
        console.error("Debug marketplace error:", error);
        return jsonError(error instanceof Error ? error.message : "Failed", 500);
    }
}
