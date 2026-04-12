import { z } from "zod";
import { revalidateTag } from "next/cache";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { storeCollectionsRepo } from "@/modules/storefront/repo/store-collections-repo";
import { storeRepo } from "@/modules/storefront/repo/store-repo";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, HttpError, isDemoStore } from "@/shared/lib/api/response-utils";

const createCollectionSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(1).max(120),
  image: z.string().url().optional().nullable(),
});

export const GET = withApi({ auth: false }, async ({ req, session }) => {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId") || "";
  const q = (searchParams.get("q") || "").trim();

  if (!storeId) throw new HttpError("storeId is required", 400);

  const store = await storeRepo.findById(storeId);
  if (!store) throw new HttpError("Store not found", 404);

  if (!session?.user && !isDemoStore(store.slug)) throw new HttpError("Unauthorized", 401);

  if (session?.user) {
    const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
    if (!access.store) throw new HttpError("Store not found", 404);
    if (!access.isAuthorized) throw new HttpError("Forbidden", 403);
  }

  const collections = await storeCollectionsRepo.listByStore(storeId, q);
  return jsonSuccess(collections);
});

export const POST = withApi({ schema: createCollectionSchema }, async ({ session, body }) => {
  const access = await resolveTenantAdminAccessByStoreId(session.user.id, body.storeId, "write");
  if (!access.store) throw new HttpError("Store not found", 404);
  if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

  const slug = await storeCollectionsRepo.generateUniqueSlugForCreate(body.storeId, body.name);
  const nextSortOrder = await storeCollectionsRepo.getNextSortOrder(body.storeId);

  const created = await storeCollectionsRepo.createCollection({
    tenantId: access.store.tenantId,
    storeId: body.storeId,
    name: body.name.trim(),
    slug,
    image: body.image ?? null,
    sortOrder: nextSortOrder,
  });

  const store = await storeCollectionsRepo.findStoreSlugByStoreId(body.storeId);
  if (store?.slug) {
    revalidateTag(`storefront:store:${store.slug}:collections`, "default");
    revalidateTag(`storefront:store:${store.slug}:products`, "default");
  }

  return jsonSuccess({ ...created, productCount: 0 }, { status: 201 });
});
