import { NextResponse } from "next/server";
import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { storeRepo } from "@/repo/store-repo";
import { tenantMembershipRepo } from "@/repo/tenant-membership-repo";

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
        const store = await storeRepo.findBySlug(slug);

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Verify user is a member of the tenant
        const membership = await tenantMembershipRepo.findByUserAndTenant(session.user.id, store.tenantId);

        if (!membership) {
            return NextResponse.json({ error: "Unauthorized: You do not have access to this store." }, { status: 403 });
        }

        const firstStore = await storeRepo.updateHeroMedia(store.id, store.tenantId, heroMedia ?? []);

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
