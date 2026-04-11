import { z } from "zod";
import { revalidateTag } from "next/cache";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { storeCollectionsRepo } from "@/repo/store-collections-repo";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/lib/api/response-utils";

const updateProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).default([]),
});

export const GET = withApi<undefined, { collectionId: string }>({}, async ({ session, params }) => {
  const { collectionId } = params;
  const collection = await storeCollectionsRepo.findBasicById(collectionId);
  if (!collection) throw new HttpError("Collection not found", 404);

  const access = await resolveTenantAdminAccessByStoreId(session.user.id, collection.storeId, "read");
  if (!access.store) throw new HttpError("Store not found", 404);
  if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

  const productIds = await storeCollectionsRepo.findProductIdsByCollectionId(collectionId);
  return jsonSuccess({ productIds });
});

export const PUT = withApi<z.infer<typeof updateProductsSchema>, { collectionId: string }>({ schema: updateProductsSchema }, async ({ session, params, body }) => {
  const { collectionId } = params;
  const collection = await storeCollectionsRepo.findBasicById(collectionId);
  if (!collection) throw new HttpError("Collection not found", 404);

  const access = await resolveTenantAdminAccessByStoreId(session.user.id, collection.storeId, "write");
  if (!access.store) throw new HttpError("Store not found", 404);
  if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

  const normalizedIds = Array.from(new Set(body.productIds));
  const validProducts = await storeCollectionsRepo.findValidProductsForCollection(
    collection.storeId,
    collection.tenantId,
    normalizedIds,
  );

  await storeCollectionsRepo.replaceCollectionProducts(
    collectionId,
    validProducts.map((p) => p.id),
  );

  const store = await storeCollectionsRepo.findStoreSlugByStoreId(collection.storeId);
  if (store?.slug) {
    revalidateTag(`storefront:store:${store.slug}:collections`, "max");
    revalidateTag(`storefront:store:${store.slug}:products`, "max");
  }

  return jsonSuccess({
    success: true,
    productCount: validProducts.length,
    productIds: validProducts.map((p) => p.id),
  });
});
