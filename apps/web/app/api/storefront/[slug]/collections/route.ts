import { storefrontService } from "@/modules/storefront";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/lib/api/response-utils";

export const GET = withApi<undefined, { slug: string }>({ auth: false }, async ({ req, params }) => {
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  const store = await storefrontService.findStoreBySlug(params.slug);
  if (!store) throw new HttpError("Store not found", 404);
  const collections = await storefrontService.getStoreCollections(store.id, q);
  return jsonSuccess(collections);
});
