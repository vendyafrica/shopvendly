import { NextRequest } from "next/server";
import { storeRepo } from "@/repo/store-repo";
import { tenantRepo } from "@/repo/tenant-repo";
import { jsonSuccess, jsonError } from "@/lib/api/response-utils";

// Public route — no auth required
export async function GET(req: NextRequest) {
    try {
        const email = new URL(req.url).searchParams.get("email")?.trim();

        if (!email) {
            return jsonError("email is required", 400);
        }

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
    } catch (error) {
        console.error("Seller precheck failed", error);
        return jsonError("Failed to check seller status", 500);
    }
}
