import { NextRequest } from "next/server";
import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { getTenantMembership } from "@/modules/admin";
import { storeRepo } from "@/repo/store-repo";
import { superAdminRepo } from "@/repo/super-admin-repo";
import { jsonSuccess } from "@/lib/api/response-utils";

// This route intentionally handles unauthenticated users (returns { hasTenant: false })
// so it cannot use withApi({ auth: true })
export const GET = async (_req: NextRequest) => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        return jsonSuccess({ hasTenant: false });
    }

    const membership = await getTenantMembership(session.user.id, { includeTenant: true });
    const hasTenant = !!membership;

    if (!membership) {
        return jsonSuccess({ hasTenant });
    }

    const [store, superAdmin] = await Promise.all([
        storeRepo.findActiveByTenantId(membership.tenantId),
        superAdminRepo.findByUserId(session.user.id),
    ]);

    const isTenantAdmin = ["owner", "admin"].includes(membership.role) || !!superAdmin;

    return jsonSuccess({
        hasTenant,
        isTenantAdmin,
        adminStoreSlug: store?.slug ?? null,
        tenantSlug: membership.tenant?.slug ?? null,
    });
};
