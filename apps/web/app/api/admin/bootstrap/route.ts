import { resolveTenantAdminAccess } from "@/modules/admin/services/access-service";
import { storeRepo } from "@/repo/store-repo";
import { tenantRepo } from "@/repo/tenant-repo";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError, isDemoStore } from "@/lib/api/response-utils";

export const GET = withApi({ auth: false }, async ({ req, session }) => {
    const { searchParams } = new URL(req.url);
    const storeSlug = searchParams.get("storeSlug");

    if (!storeSlug) throw new HttpError("Missing storeSlug", 400);

    const store = await storeRepo.findAdminBySlug(storeSlug);
    if (!store) throw new HttpError("Store not found", 404);

    if (!session?.user) {
        if (!isDemoStore(storeSlug)) throw new HttpError("Unauthorized", 401);

        return jsonSuccess({
            tenantId: store.tenantId,
            tenantSlug: undefined,
            storeId: store.id,
            storeSlug,
            storeName: store.name,
            storeDescription: store.description,
            storeLogoUrl: store.logoUrl,
            defaultCurrency: store.defaultCurrency,
            collectoPassTransactionFeeToCustomer: store.collectoPassTransactionFeeToCustomer ?? false,
            collectoPayoutMode: store.collectoPayoutMode ?? "automatic_per_order",
            isDemoViewer: true,
            canWrite: false,
        });
    }

    const [access, writeAccess] = await Promise.all([
        resolveTenantAdminAccess(session.user.id, storeSlug),
        resolveTenantAdminAccess(session.user.id, storeSlug, "write"),
    ]);

    if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

    const tenant = await tenantRepo.findSlugById(store.tenantId);

    return jsonSuccess({
        tenantId: store.tenantId,
        tenantSlug: tenant?.slug,
        storeId: store.id,
        storeSlug,
        storeName: store.name,
        storeDescription: store.description,
        storeLogoUrl: store.logoUrl,
        defaultCurrency: store.defaultCurrency,
        collectoPassTransactionFeeToCustomer: store.collectoPassTransactionFeeToCustomer ?? false,
        collectoPayoutMode: store.collectoPayoutMode ?? "automatic_per_order",
        isDemoViewer: isDemoStore(storeSlug) && !writeAccess.isAuthorized,
        canWrite: writeAccess.isAuthorized,
    });
});
