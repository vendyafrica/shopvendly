import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { storeRepo } from "@/repo/store-repo";
import { tenantMembershipRepo } from "@/repo/tenant-membership-repo";
import { productsAdminRepo } from "@/repo/products-admin-repo";
import { z } from "zod";

import { type StoreRouteParams as RouteParams } from "@/models";

const updateStoreSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    storePolicy: z.string().optional(),
    storeContactPhone: z.string().optional(),
    storeAddress: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal("")),
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
        const store = await storeRepo.findById(storeId);

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

        const { storeId } = await params;
        const store = await storeRepo.findById(storeId);
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const membership = await tenantMembershipRepo.findByUserAndTenant(session.user.id, store.tenantId);

        if (!membership) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const body = await request.json();
        const parsed = updateStoreSchema.parse(body);
        const input = {
            ...parsed,
            storePolicy: parsed.storePolicy === "" ? null : parsed.storePolicy,
            logoUrl: parsed.logoUrl === "" ? null : parsed.logoUrl,
        };

        const updated = await storeRepo.update(storeId, membership.tenantId, input);

        if (!updated) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        if (input.defaultCurrency) {
            await productsAdminRepo.updateCurrencyByStore(storeId, membership.tenantId, input.defaultCurrency);
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

        const { storeId } = await params;
        const store = await storeRepo.findById(storeId);
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const membership = await tenantMembershipRepo.findByUserAndTenant(session.user.id, store.tenantId);

        if (!membership) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        await storeRepo.delete(storeId, membership.tenantId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting store:", error);
        return NextResponse.json({ error: "Failed to delete store" }, { status: 500 });
    }
}
