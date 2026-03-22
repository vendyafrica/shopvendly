import { db } from "@shopvendly/db/db";
import { stores, tenants } from "@shopvendly/db/schema";
import { and, desc, eq, isNull } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";
import { z } from "zod";

const updateGlobalDeliveryProviderSchema = z.object({
    deliveryProviderPhone: z.string().trim().min(1).nullable(),
    collectoPassTransactionFeeToCustomer: z.boolean().optional(),
    collectoPayoutMode: z.enum(["automatic_per_order", "manual_batch"]).optional(),
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
                storeContactPhone: stores.storeContactPhone,
                deliveryProviderPhone: stores.deliveryProviderPhone,
                collectoPassTransactionFeeToCustomer: stores.collectoPassTransactionFeeToCustomer,
                collectoPayoutMode: stores.collectoPayoutMode,
                createdAt: stores.createdAt,
                tenantName: tenants.fullName,
                tenantPhone: tenants.phoneNumber,
            })
            .from(stores)
            .leftJoin(tenants, eq(stores.tenantId, tenants.id))
            .orderBy(desc(stores.createdAt));

        await Promise.all(
            data
                .filter((store) => !store.storeContactPhone && store.tenantPhone)
                .map((store) =>
                    db
                        .update(stores)
                        .set({ storeContactPhone: store.tenantPhone })
                        .where(and(eq(stores.id, store.id), isNull(stores.storeContactPhone)))
                )
        );

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
            collectoPassTransactionFeeToCustomer: body?.collectoPassTransactionFeeToCustomer,
            collectoPayoutMode: body?.collectoPayoutMode,
        });

        await db
            .update(stores)
            .set({
                deliveryProviderPhone: parsed.deliveryProviderPhone,
                ...(parsed.collectoPassTransactionFeeToCustomer !== undefined
                    ? { collectoPassTransactionFeeToCustomer: parsed.collectoPassTransactionFeeToCustomer }
                    : {}),
                ...(parsed.collectoPayoutMode !== undefined
                    ? { collectoPayoutMode: parsed.collectoPayoutMode }
                    : {}),
            });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Global Delivery Provider Error:", error);
        return NextResponse.json({ error: "Failed to update delivery provider number" }, { status: 500 });
    }
}
