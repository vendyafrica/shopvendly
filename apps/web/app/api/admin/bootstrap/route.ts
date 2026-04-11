import { NextRequest } from "next/server";
import { resolveTenantAdminAccess } from "@/modules/admin/services/access-service";
import { storeRepo } from "@/repo/store-repo";
import { jsonSuccess, jsonError, isDemoStore, getOptionalSession } from "@/lib/api/response-utils";

export async function GET(request: NextRequest) {
    const session = await getOptionalSession(request);
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug");

    if (!storeSlug) return jsonError("Missing storeSlug", 400);
    const store = await storeRepo.findAdminBySlug(storeSlug);

    if (!store) return jsonError("Store not found", 404);

    if (!session?.user) {
        if (!isDemoStore(storeSlug)) return jsonError("Unauthorized", 401);

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

    if (!access.isAuthorized) return jsonError("Forbidden", 403);

    const { tenantRepo } = await import("@/repo/tenant-repo");
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
}
