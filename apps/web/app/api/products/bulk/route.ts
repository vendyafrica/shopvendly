import { z } from "zod";
import { resolveTenantAdminAccessByStoreId } from "@/modules/admin";
import { productsAdminRepo } from "@/modules/admin/repo/products-admin-repo";
import { withApi } from "@/shared/lib/api/with-api";
import { jsonSuccess, jsonError, HttpError } from "@/shared/lib/api/response-utils";

const bulkUpdateSchema = z.object({
    storeId: z.string().uuid(),
    ids: z.array(z.string(), { message: "ids must be strings" }),
    action: z.enum(["publish", "delete"]),
});

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => uuidRegex.test(value);

export const POST = withApi({ schema: bulkUpdateSchema }, async ({ session, body }) => {
    const { storeId, ids, action } = body;

    const access = await resolveTenantAdminAccessByStoreId(session.user.id, storeId, "write");
    if (!access.store) throw new HttpError("Store not found", 404);
    if (!access.isAuthorized) throw new HttpError("Forbidden", 403);

    if (ids.length === 0) return jsonSuccess({ count: 0 });

    const validIds = ids.filter(isUuid);
    if (validIds.length === 0) return jsonSuccess({ count: 0, skipped: ids.length });

    if (action === "publish") {
        await productsAdminRepo.bulkUpdateStatus(storeId, access.store.tenantId, validIds, "active");
    } else if (action === "delete") {
        await productsAdminRepo.bulkUpdateStatus(storeId, access.store.tenantId, validIds, "deleted");
    } else {
        return jsonError("Action not implemented", 400);
    }

    return jsonSuccess({ success: true, count: validIds.length, skipped: ids.length - validIds.length });
});
