import { z } from "zod";
import { authRepo } from "@/repo/auth-repo";
import { verificationRepo } from "@/repo/verification-repo";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, jsonError, HttpError } from "@/lib/api/response-utils";

const claimTokenSchema = z.object({
    token: z.string().min(1),
    email: z.string().email(),
});

/**
 * POST /api/auth/validate-claim-token
 * Validates a store claim token after a user has signed in via OAuth.
 */
export const POST = withApi({ schema: claimTokenSchema }, async ({ session, body }) => {
    const { token, email } = body;

    if (session.user.email.toLowerCase() !== email.toLowerCase()) {
        return jsonError("Email mismatch. Please sign in with the invited email address.", 403);
    }

    const record = await verificationRepo.findByEmailAndToken(email.toLowerCase(), token);
    if (!record) return jsonError("Invalid or expired claim token", 404);

    if (new Date() > new Date(record.expiresAt)) {
        await verificationRepo.deleteById(record.id);
        return jsonError("Claim token has expired", 410);
    }

    const store = await authRepo.findStoreByClaimedEmail(email.toLowerCase());
    if (!store) return jsonError("No store found for this claim", 404);

    const existingMembership = await authRepo.findTenantMembership(store.tenantId, session.user.id);
    if (!existingMembership) {
        await authRepo.addTenantMembership(store.tenantId, session.user.id, "owner");
    }

    await authRepo.resetTenantOnboarding(store.tenantId);
    await verificationRepo.deleteById(record.id);

    return jsonSuccess({
        success: true,
        storeId: store.id,
        storeSlug: store.slug,
        storeName: store.name,
        tenantId: store.tenantId,
        redirectTo: "/account",
        message: "Store claimed successfully. Complete onboarding to update your store details.",
    });
});
