import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getTenantMembership } from "@/app/admin/lib/tenant-membership";
import { db } from "@shopvendly/db/db";
import { and, eq, isNull } from "@shopvendly/db";
import { stores, superAdmins } from "@shopvendly/db/schema";

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

    const [store] = await db
        .select({ slug: stores.slug })
        .from(stores)
        .where(and(eq(stores.tenantId, membership.tenantId), isNull(stores.deletedAt)))
        .limit(1);

    const superAdmin = await db.query.superAdmins.findFirst({
        where: eq(superAdmins.userId, session.user.id),
        columns: { id: true },
    });

    const isTenantAdmin = ["owner", "admin"].includes(membership.role) || !!superAdmin;

    return NextResponse.json({
        hasTenant,
        isTenantAdmin,
        adminStoreSlug: store?.slug ?? null,
        tenantSlug: membership.tenant?.slug ?? null,
    });
};
