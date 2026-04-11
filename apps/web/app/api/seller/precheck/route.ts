import { storeRepo } from "@/repo/store-repo";
import { tenantRepo } from "@/repo/tenant-repo";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/lib/api/response-utils";

export const GET = withApi({ auth: false }, async ({ req }) => {
    const email = new URL(req.url).searchParams.get("email")?.trim();

    if (!email) throw new HttpError("email is required", 400);

    const tenant = await tenantRepo.findSellerByBillingEmail(email);

    let adminStoreSlug: string | null = null;
    if (tenant) {
        const store = await storeRepo.findFirstByTenantId(tenant.id);
        adminStoreSlug = store?.slug ?? null;
    }

    return jsonSuccess({
        isSeller: !!tenant,
        adminStoreSlug,
        tenantSlug: tenant?.slug ?? null,
    });
});
