import { db } from "@shopvendly/db/db";
import { stores, tenants } from "@shopvendly/db/schema";
import { isNull, eq } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";

/**
 * GET /api/super-admin/unclaimed-stores
 * Returns stores that haven't been assigned to any user yet (claimedByEmail IS NULL).
 */
export async function GET() {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    try {
        const data = await db
            .select({
                id: stores.id,
                name: stores.name,
                slug: stores.slug,
                tenantId: stores.tenantId,
            })
            .from(stores)
            .leftJoin(tenants, eq(stores.tenantId, tenants.id))
            .where(isNull(stores.claimedByEmail))
            .orderBy(stores.name);

        return NextResponse.json(data);
    } catch (error) {
        console.error("[unclaimed-stores] Error:", error);
        return NextResponse.json({ error: "Failed to fetch unclaimed stores" }, { status: 500 });
    }
}
