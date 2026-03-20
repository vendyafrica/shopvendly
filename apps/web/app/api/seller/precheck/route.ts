import { NextResponse } from "next/server";
import { storeRepo } from "@/repo/store-repo";
import { tenantRepo } from "@/repo/tenant-repo";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email")?.trim();

        if (!email) {
            return NextResponse.json({ error: "email is required" }, { status: 400 });
        }

        const tenant = await tenantRepo.findSellerByBillingEmail(email);

        let adminStoreSlug: string | null = null;

        if (tenant) {
            const store = await storeRepo.findFirstByTenantId(tenant.id);
            adminStoreSlug = store?.slug ?? null;
        }

        return NextResponse.json({
            isSeller: !!tenant,
            adminStoreSlug,
            tenantSlug: tenant?.slug ?? null,
        });
    } catch (error) {
        console.error("Seller precheck failed", error);
        return NextResponse.json({ error: "Failed to check seller status" }, { status: 500 });
    }
}
