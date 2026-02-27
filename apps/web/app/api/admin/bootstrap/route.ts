import { auth } from "@shopvendly/auth";
import { db } from "@shopvendly/db/db";
import { stores, tenantMemberships } from "@shopvendly/db/schema";
import { eq, isNull, and } from "@shopvendly/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

    const membership = await db.query.tenantMemberships.findFirst({
        where: eq(tenantMemberships.userId, session.user.id),
        with: { tenant: true },
    });

    if (!membership) {
        return NextResponse.json({ error: "No tenant membership" }, { status: 404 });
    }

    const store = await db.query.stores.findFirst({
        where: and(eq(stores.slug, storeSlug), eq(stores.tenantId, membership.tenantId), isNull(stores.deletedAt)),
        columns: {
            id: true,
            slug: true,
            name: true,
            tenantId: true,
            defaultCurrency: true,
        },
    });

    if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({
        tenantId: membership.tenantId,
        tenantSlug: membership.tenant?.slug,
        storeId: store.id,
        storeSlug: store.slug,
        storeName: store.name,
        defaultCurrency: store.defaultCurrency,
    });
}
