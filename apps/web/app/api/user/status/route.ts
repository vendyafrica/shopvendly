import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getTenantMembership } from "@/app/admin/lib/tenant-membership";
import { storeRepo } from "@/repo/store-repo";
import { superAdminRepo } from "@/repo/super-admin-repo";

export const GET = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return NextResponse.json({ hasTenant: false });
    }

    const membership = await getTenantMembership(session.user.id, { includeTenant: true });

    const hasTenant = !!membership;

    if (!membership) {
        return NextResponse.json({ hasTenant });
    }

    const store = await storeRepo.findActiveByTenantId(membership.tenantId);
    const superAdmin = await superAdminRepo.findByUserId(session.user.id);

    const isTenantAdmin = ["owner", "admin"].includes(membership.role) || !!superAdmin;

    return NextResponse.json({
        hasTenant,
        isTenantAdmin,
        adminStoreSlug: store?.slug ?? null,
        tenantSlug: membership.tenant?.slug ?? null,
    });
};
