import { NextRequest } from "next/server";
import { z } from "zod";
import { storeRepo } from "@/repo/store-repo";
import { productsAdminRepo } from "@/repo/products-admin-repo";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, HttpError } from "@/lib/api/response-utils";

const updateStoreSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    storePolicy: z.string().optional(),
    storeContactPhone: z.string().optional(),
    storeAddress: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal("")),
    categories: z.array(z.string()).optional(),
    status: z.boolean().optional(),
    defaultCurrency: z.enum(["UGX", "KES", "USD"]).optional(),
    collectoPassTransactionFeeToCustomer: z.boolean().optional(),
    collectoPayoutMode: z.enum(["automatic_per_order", "manual_batch"]).optional(),
});

/**
 * GET /api/stores/[storeId]
 * Get a single store by ID
 */
export const GET = withApi<undefined, { storeId: string }>({}, async ({ params }) => {
    const store = await storeRepo.findById(params.storeId);
    if (!store) throw new HttpError("Store not found", 404);
    return jsonSuccess(store);
});

/**
 * PATCH /api/stores/[storeId]
 * Update a store
 */
export const PATCH = withApi<z.infer<typeof updateStoreSchema>, { storeId: string }>({ schema: updateStoreSchema }, async ({ session, params, body }) => {
    const access = await resolveTenantAdminAccessByStoreId(session.user.id, params.storeId, "write");
    if (!access.store) throw new HttpError("Store not found", 404);
    if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

    const input = {
        ...body,
        storePolicy: body.storePolicy === "" ? null : body.storePolicy,
        logoUrl: body.logoUrl === "" ? null : body.logoUrl,
    };

    const updated = await storeRepo.update(params.storeId, access.store.tenantId, input);
    if (!updated) throw new HttpError("Store not found", 404);

    if (input.defaultCurrency) {
        await productsAdminRepo.updateCurrencyByStore(params.storeId, access.store.tenantId, input.defaultCurrency);
    }

    return jsonSuccess(updated);
});

/**
 * DELETE /api/stores/[storeId]
 * Delete a store
 */
export const DELETE = withApi<undefined, { storeId: string }>({}, async ({ session, params }) => {
    const access = await resolveTenantAdminAccessByStoreId(session.user.id, params.storeId, "write");
    if (!access.store) throw new HttpError("Store not found", 404);
    if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

    await storeRepo.delete(params.storeId, access.store.tenantId);
    return jsonSuccess({ success: true });
});
