import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { storeCollectionsRepo } from "@/repo/store-collections-repo";
import { storeRepo } from "@/repo/store-repo";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, jsonError, HttpError, isDemoStore, getOptionalSession } from "@/lib/api/response-utils";

const createCollectionSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(1).max(120),
  image: z.string().url().optional().nullable(),
});

// GET has demo-store logic so cannot use withApi({ auth: true })
export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId") || "";
    const q = (searchParams.get("q") || "").trim();

    if (!storeId) return jsonError("storeId is required", 400);

    const store = await storeRepo.findById(storeId);
    if (!store) return jsonError("Store not found", 404);

    if (!session?.user && !isDemoStore(store.slug)) return jsonError("Unauthorized", 401);

    if (session?.user) {
      const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "read");
      if (!access.store) return jsonError("Store not found", 404);
      if (!access.isAuthorized) return jsonError("Forbidden", 403);
    }

    const collections = await storeCollectionsRepo.listByStore(storeId, q);
    return jsonSuccess(collections);
  } catch (error) {
    console.error("Error listing store collections:", error);
    return jsonError("Failed to list collections", 500);
  }
}

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
