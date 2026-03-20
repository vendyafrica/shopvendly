import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { resolveTenantAdminAccess } from "../../../admin/lib/admin-access";

export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug");

    if (!storeSlug) {
        return NextResponse.json({ error: "Missing storeSlug" }, { status: 400 });
    }

    const access = await resolveTenantAdminAccess(session.user.id, storeSlug);
    const store = access.store;

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
        storeLogoUrl: store.logoUrl,
        defaultCurrency: store.defaultCurrency,
    });
}
