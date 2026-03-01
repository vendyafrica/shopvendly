import { NextResponse } from "next/server";
import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { db, stores, tenantMemberships, eq, and } from "@shopvendly/db";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { slug } = await params;
        const body = await request.json();
        const heroMedia = (body?.heroMedia ?? undefined) as string[] | undefined;

        // Get the store first
        const store = await db.query.stores.findFirst({
            where: eq(stores.slug, slug),
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Verify user is a member of the tenant
        const membership = await db.query.tenantMemberships.findFirst({
            where: and(
                eq(tenantMemberships.userId, session.user.id),
                eq(tenantMemberships.tenantId, store.tenantId)
            ),
        });

        if (!membership) {
            return NextResponse.json({ error: "Unauthorized: You do not have access to this store." }, { status: 403 });
        }

        const updatedStore = await db
            .update(stores)
            .set({
                heroMedia: heroMedia ?? [],
                updatedAt: new Date(),
            })
            .where(eq(stores.id, store.id))
            .returning();

        const firstStore = updatedStore[0];

        if (!firstStore) {
            return NextResponse.json({ error: "Failed to update store hero" }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            heroMedia: firstStore.heroMedia,
        });
    } catch (error) {
        console.error("Failed to update store hero:", error);
        return NextResponse.json(
            { error: "Failed to update store hero" },
            { status: 500 }
        );
    }
}
