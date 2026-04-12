import { storeRepo } from "@/modules/storefront/repo/store-repo";
import { tenantMembershipRepo } from "@/modules/admin/repo/tenant-membership-repo";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/shared/lib/api/response-utils";

export const PUT = withApi<undefined, { slug: string }>({}, async ({ req, session, params }) => {
    const { slug } = params;
    const body = await req.json();
    const heroMedia = (body?.heroMedia ?? undefined) as string[] | undefined;

    const store = await storeRepo.findBySlug(slug);
    if (!store) throw new HttpError("Store not found", 404);

    const membership = await tenantMembershipRepo.findByUserAndTenant(session.user.id, store.tenantId);
    if (!membership) throw new HttpError("You do not have access to this store", 403);

    const updated = await storeRepo.updateHeroMedia(store.id, store.tenantId, heroMedia ?? []);
    if (!updated) throw new HttpError("Failed to update store hero", 500);

    return jsonSuccess({ success: true, heroMedia: updated.heroMedia });
});
