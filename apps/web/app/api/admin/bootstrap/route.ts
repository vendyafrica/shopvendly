import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { resolveTenantAdminAccess } from "@/modules/admin/services/access-service";
import { storeRepo } from "@/repo/store-repo";

export async function GET(request: NextRequest) {
    const headerList = await headers();
    const session = await auth.api.getSession({
        headers: headerList,
    });

    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug");

    if (!storeSlug) {
        return NextResponse.json({ error: "Missing storeSlug" }, { status: 400 });
    }

    const isDemoStore = storeSlug === "vendly";
    const store = await storeRepo.findAdminBySlug(storeSlug);

    if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!session?.user) {
        if (!isDemoStore) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({
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

    const access = await resolveTenantAdminAccess(session.user.id, storeSlug);
    const writeAccess = await resolveTenantAdminAccess(session.user.id, storeSlug, "write");

    if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!access.isAuthorized) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { tenantRepo } = await import("@/repo/tenant-repo");
    const tenant = await tenantRepo.findSlugById(store.tenantId);

    return NextResponse.json({
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
        isDemoViewer: isDemoStore && !writeAccess.isAuthorized,
        canWrite: writeAccess.isAuthorized,
    });
}
