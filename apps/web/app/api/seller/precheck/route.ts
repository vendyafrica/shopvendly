import { NextResponse } from "next/server";
import { db } from "@shopvendly/db/db";
import { and, eq, isNull } from "@shopvendly/db";
import { stores, tenants } from "@shopvendly/db/schema";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email")?.trim();

        if (!email) {
            return NextResponse.json({ error: "email is required" }, { status: 400 });
        }

        const tenant = await db.query.tenants.findFirst({
            where: and(eq(tenants.billingEmail, email), isNull(tenants.deletedAt)),
            columns: {
                id: true,
                slug: true,
            },
        });

        let adminStoreSlug: string | null = null;

        if (tenant) {
            const store = await db.query.stores.findFirst({
                where: and(eq(stores.tenantId, tenant.id), isNull(stores.deletedAt)),
                columns: { slug: true },
            });
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
