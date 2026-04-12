import { z } from "zod";
import { revalidateTag } from "next/cache";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { storeCollectionsRepo } from "@/modules/storefront/repo/store-collections-repo";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/shared/lib/api/response-utils";

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  image: z.string().url().optional().nullable(),
});

export const PATCH = withApi<z.infer<typeof updateCollectionSchema>, { collectionId: string }>({ schema: updateCollectionSchema }, async ({ session, params, body }) => {
  const { collectionId } = params;
  const collection = await storeCollectionsRepo.findBasicById(collectionId);
  if (!collection) throw new HttpError("Collection not found", 404);

  const access = await resolveTenantAdminAccessByStoreId(session.user.id, collection.storeId, "write");
  if (!access.store) throw new HttpError("Store not found", 404);
  if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

  const name = body.name?.trim();
  const slug = name
    ? await storeCollectionsRepo.generateUniqueSlug(collection.storeId, name, collectionId)
    : undefined;

  const updated = await storeCollectionsRepo.updateCollection(collectionId, {
    ...(name ? { name, slug } : {}),
    ...(body.image !== undefined ? { image: body.image } : {}),
  });

  const store = await storeCollectionsRepo.findStoreSlugByStoreId(collection.storeId);
  if (store?.slug) {
    revalidateTag(`storefront:store:${store.slug}:collections`, "default");
    revalidateTag(`storefront:store:${store.slug}:products`, "default");
  }

  return jsonSuccess(updated);
});

export const DELETE = withApi<undefined, { collectionId: string }>({}, async ({ session, params }) => {
  const { collectionId } = params;
  const collection = await storeCollectionsRepo.findBasicById(collectionId);
  if (!collection) throw new HttpError("Collection not found", 404);

  const access = await resolveTenantAdminAccessByStoreId(session.user.id, collection.storeId, "write");
  if (!access.store) throw new HttpError("Store not found", 404);
  if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

  await storeCollectionsRepo.deleteCollection(collectionId);

  const store = await storeCollectionsRepo.findStoreSlugByStoreId(collection.storeId);
  if (store?.slug) {
    revalidateTag(`storefront:store:${store.slug}:collections`, "default");
    revalidateTag(`storefront:store:${store.slug}:products`, "default");
  }

  return jsonSuccess({ success: true });
});
