import { z } from "zod";
import { storeRepo } from "@/repo/store-repo";
import { tenantMembershipRepo } from "@/repo/tenant-membership-repo";
import { superAdminRepo } from "@/repo/super-admin-repo";
import { sendNewStoreAlertEmail } from "@shopvendly/transactional";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, jsonError, HttpError } from "@/lib/api/response-utils";

const createStoreSchema = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(100),
    description: z.string().optional(),
    storeContactPhone: z.string().optional(),
    storeAddress: z.string().optional(),
    categories: z.array(z.string()).optional(),
});

/**
 * GET /api/stores
 * List stores for the authenticated seller
 */
export const GET = withApi({}, async ({ session }) => {
    const membership = await tenantMembershipRepo.findByUserId(session.user.id);
    if (!membership) throw new HttpError("No tenant found", 404);
    const storeList = await storeRepo.findByTenantId(membership.tenantId);
    return jsonSuccess(storeList);
});

/**
 * POST /api/stores
 * Create a new store
 */
export const POST = withApi({ schema: createStoreSchema }, async ({ session, body }) => {
    const membership = await tenantMembershipRepo.findByUserId(session.user.id);
    if (!membership) throw new HttpError("No tenant found", 404);

    const existing = await storeRepo.findBySlug(body.slug);
    if (existing) return jsonError("Store slug already exists", 400);

    const store = await storeRepo.create({ tenantId: membership.tenantId, status: true, ...body });
    if (!store) throw new HttpError("Failed to create store", 500);

    // Notify super admins asynchronously — fire and forget
    superAdminRepo.listNotificationRecipients().then((adminRecords) => {
        if (adminRecords.length === 0) return;
        const adminStoreUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.shopvendly.store";
        Promise.allSettled(
            adminRecords.map((admin) =>
                sendNewStoreAlertEmail({
                    to: admin.email,
                    storeName: store.name,
                    storeSlug: store.slug,
                    sellerName: session.user.name || "A Seller",
                    sellerEmail: session.user.email,
                    adminStoreUrl,
                }),
            ),
        ).catch((err) => console.error("Failed to send new store alert emails:", err));
    }).catch((err) => console.error("Failed to fetch super admins:", err));

    return jsonSuccess(store, { status: 201 });
});
