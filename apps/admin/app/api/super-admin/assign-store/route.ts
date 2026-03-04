import { db } from "@shopvendly/db/db";
import { stores, tenants, tenantMemberships, users, verification } from "@shopvendly/db/schema";
import { eq, isNull, and } from "@shopvendly/db";
import { NextResponse } from "next/server";
import { checkSuperAdminApi } from "@/lib/auth-guard";
import { sendStoreAssignmentEmail } from "@shopvendly/transactional";
import { z } from "zod";
import crypto from "crypto";

const bodySchema = z.object({
    email: z.string().email("Invalid email address"),
    storeId: z.string().uuid("Invalid store ID"),
});

/**
 * POST /api/super-admin/assign-store
 * Assigns an unclaimed store to a user email and sends a welcome / onboarding email.
 *
 * Steps:
 * 1. Validate input.
 * 2. Verify the store is unclaimed (claimedByEmail IS NULL).
 * 3. Mark it claimed (claimedByEmail = email).
 * 4. If the user already has an account → link them to the store's tenant as owner
 *    and reset the tenant to onboarding state.
 * 5. Generate a 24-hour verification token for the onboarding deep-link.
 * 6. Send the store-assignment welcome email.
 */
export async function POST(req: Request) {
    const authResult = await checkSuperAdminApi(["super_admin"]);
    if (authResult.error) {
        return NextResponse.json(authResult, { status: authResult.status });
    }

    const configuredWebUrl =
        process.env.WEB_URL ||
        process.env.NEXT_PUBLIC_WEB_URL ||
        process.env.NEXT_PUBLIC_APP_URL;
    const origin = req.headers.get("origin")?.trim();
    const webBaseUrl = (configuredWebUrl || origin)?.replace(/\/$/, "") ?? "https://shopvendly.store";
    const normalizedWebBaseUrl = webBaseUrl.startsWith("http")
        ? webBaseUrl
        : `https://${webBaseUrl}`;

    try {
        const body = await req.json();
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? "Invalid input" },
                { status: 400 }
            );
        }

        const { email, storeId } = parsed.data;

        // Fetch the store and make sure it's still unclaimed
        const store = await db.query.stores.findFirst({
            where: and(eq(stores.id, storeId), isNull(stores.claimedByEmail)),
        });

        if (!store) {
            return NextResponse.json(
                { error: "Store not found or already claimed." },
                { status: 404 }
            );
        }

        // Mark the store as claimed
        await db
            .update(stores)
            .set({ claimedByEmail: email })
            .where(and(eq(stores.id, storeId), isNull(stores.claimedByEmail)));

        // Check if the user already has an account
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            // Ensure the user is a member of this store's tenant
            const existingMembership = await db.query.tenantMemberships.findFirst({
                where: and(
                    eq(tenantMemberships.tenantId, store.tenantId),
                    eq(tenantMemberships.userId, existingUser.id)
                ),
            });

            if (!existingMembership) {
                await db.insert(tenantMemberships).values({
                    tenantId: store.tenantId,
                    userId: existingUser.id,
                    role: "owner",
                });
            }

            // Reset tenant to onboarding so the user can set their store details
            await db
                .update(tenants)
                .set({ status: "onboarding", onboardingStep: "signup" })
                .where(eq(tenants.id, store.tenantId));
        }

        // Generate a one-time verification token (24 h) for the onboarding deep-link
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.insert(verification).values({
            id: crypto.randomBytes(16).toString("hex"),
            identifier: email,
            value: token,
            expiresAt,
        });

        // Build the onboarding deep-link
        const verifyBase = `${normalizedWebBaseUrl}/api/auth/verify-seller?token=${token}&email=${encodeURIComponent(email)}`;
        const onboardingUrl = `${verifyBase}&redirect=${encodeURIComponent("/account")}`;

        // Send the store assignment email
        let emailSent = false;
        let emailError: string | null = null;
        try {
            await sendStoreAssignmentEmail({
                to: email,
                storeName: store.name,
                onboardingUrl,
            });
            emailSent = true;
        } catch (err) {
            emailError = err instanceof Error ? err.message : "Unknown email error";
            console.error("[assign-store] Failed to send assignment email:", err);
        }

        return NextResponse.json({ success: true, emailSent, emailError });
    } catch (error) {
        console.error("[assign-store] Error:", error);
        return NextResponse.json({ error: "Failed to assign store." }, { status: 500 });
    }
}
