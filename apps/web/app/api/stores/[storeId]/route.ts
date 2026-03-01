import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { storeService } from "@/app/[handle]/lib/store-service";
import { db } from "@shopvendly/db/db";
import { products, tenantMemberships } from "@shopvendly/db/schema";
import { eq, and, isNull } from "@shopvendly/db";
import { z } from "zod";

type RouteParams = {
    params: Promise<{ storeId: string }>;
};

const updateStoreSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    storeContactPhone: z.string().optional(),
    storeAddress: z.string().optional(),
    categories: z.array(z.string()).optional(),
    // DB schema stores status as boolean (active flag). Align validation accordingly.
    status: z.boolean().optional(),
    defaultCurrency: z.enum(["UGX", "KES", "USD"]).optional(),
});

/**
 * GET /api/stores/[storeId]
 * Get a single store by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { storeId } = await params;
        const store = await storeService.findById(storeId);

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        return NextResponse.json(store);
    } catch (error) {
        console.error("Error fetching store:", error);
        return NextResponse.json({ error: "Failed to fetch store" }, { status: 500 });
    }
}

/**
 * PATCH /api/stores/[storeId]
 * Update a store
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const membership = await db.query.tenantMemberships.findFirst({
            where: eq(tenantMemberships.userId, session.user.id),
        });

        if (!membership) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const { storeId } = await params;
        const body = await request.json();
        const input = updateStoreSchema.parse(body);

        const updated = await storeService.update(storeId, membership.tenantId, input);

        if (!updated) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        if (input.defaultCurrency) {
            await db
                .update(products)
                .set({ currency: input.defaultCurrency, updatedAt: new Date() })
                .where(
                    and(
                        eq(products.storeId, storeId),
                        eq(products.tenantId, membership.tenantId),
                        isNull(products.deletedAt)
                    )
                );
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating store:", error);
        return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
    }
}

/**
 * DELETE /api/stores/[storeId]
 * Delete a store
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const membership = await db.query.tenantMemberships.findFirst({
            where: eq(tenantMemberships.userId, session.user.id),
        });

        if (!membership) {
            return NextResponse.json({ error: "No tenant found" }, { status: 404 });
        }

        const { storeId } = await params;
        await storeService.delete(storeId, membership.tenantId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting store:", error);
        return NextResponse.json({ error: "Failed to delete store" }, { status: 500 });
    }
}
