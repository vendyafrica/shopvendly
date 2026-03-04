import { db } from "@shopvendly/db/db";
import { stores, tenants } from "@shopvendly/db/schema";
import { eq, desc } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";
import { z } from "zod";

const updateGlobalDeliveryProviderSchema = z.object({
    deliveryProviderPhone: z.string().trim().min(1).nullable(),
});

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
                deliveryProviderPhone: stores.deliveryProviderPhone,
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

export async function PATCH(req: Request) {
    const auth = await checkSuperAdminApi(["super_admin"]);
    if (auth.error) {
        return NextResponse.json(auth, { status: auth.status });
    }

    try {
        const body = await req.json();
        const parsed = updateGlobalDeliveryProviderSchema.parse({
            deliveryProviderPhone: body?.deliveryProviderPhone ?? null,
        });

        await db
            .update(stores)
            .set({
                deliveryProviderPhone: parsed.deliveryProviderPhone,
            });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Global Delivery Provider Error:", error);
        return NextResponse.json({ error: "Failed to update delivery provider number" }, { status: 500 });
    }
}
