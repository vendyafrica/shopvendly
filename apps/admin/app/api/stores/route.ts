import { db } from "@shopvendly/db/db";
import { stores, tenants } from "@shopvendly/db/schema";
import { eq, desc } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";

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
                status: stores.status,
                createdAt: stores.createdAt,
                tenantName: tenants.fullName
            })
            .from(stores)
            .leftJoin(tenants, eq(stores.tenantId, tenants.id))
            .orderBy(desc(stores.createdAt));

        return NextResponse.json(data);
    } catch (error) {
        console.error("Stores API Error:", error);
        return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 });
    }
}
