import { storefrontService } from "@/modules/storefront";
import type { StorefrontCategory } from "@/models/storefront";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/lib/api/response-utils";

/**
 * GET /api/storefront/[slug]/categories
 * Returns store categories (public)
 */
export const GET = withApi<undefined, { slug: string }>({ auth: false }, async ({ params }) => {
    const store = await storefrontService.findStoreBySlug(params.slug);
    if (!store) throw new HttpError("Store not found", 404);

    const categories: StorefrontCategory[] = (store.categories ?? []).map((name: string) => ({
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        image: null,
    }));

    return jsonSuccess(categories);
});
