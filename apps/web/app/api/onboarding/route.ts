import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { onboardingService } from "@/app/c/lib/onboarding-service";
import { onboardingRepository } from "@/app/c/lib/onboarding-repository";
import type { OnboardingData } from "@/app/c/lib/models";
import { db } from "@shopvendly/db/db";
import { verification, tenantMemberships, tenants, stores } from "@shopvendly/db/schema";
import { eq } from "@shopvendly/db";
import { sendWelcomeEmail } from "@shopvendly/transactional";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { data } = body as { data: OnboardingData };

        if (!data) {
            return NextResponse.json({ error: "Missing onboarding data" }, { status: 400 });
        }

        // ── Idempotency: if user already has a tenant, return it ─────
        const alreadyOnboarded = await onboardingRepository.hasTenant(session.user.id);
        if (alreadyOnboarded) {
            // Fetch existing tenant + store to return consistent shape
            const membership = await db.query.tenantMemberships.findFirst({
                where: eq(tenantMemberships.userId, session.user.id),
            });
            if (membership) {
                const tenant = await db.query.tenants.findFirst({
                    where: eq(tenants.id, membership.tenantId),
                });
                const store = await db.query.stores.findFirst({
                    where: eq(stores.tenantId, membership.tenantId),
                });
                if (tenant && store) {
                    return NextResponse.json({
                        success: true,
                        tenantId: tenant.id,
                        storeId: store.id,
                        storeSlug: store.slug,
                        tenantSlug: tenant.slug,
                        message: "Already onboarded",
                        emailSent: false,
                        emailError: null,
                    });
                }
            }
        }

        const result = await onboardingService.createFullTenant(
            session.user.id,
            session.user.email,
            data
        );

        // Generate a single-use verification token for the welcome email (24h expiry)
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.insert(verification).values({
            id: crypto.randomBytes(16).toString("hex"),
            identifier: session.user.email,
            value: token,
            expiresAt,
        });

        // Build URLs with embedded verification token
        const webBaseUrl =
            process.env.WEB_URL ||
            process.env.NEXT_PUBLIC_WEB_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            req.headers.get("origin") ||
            "https://vendlyafrica.store";
        const storeSlug = result.storeSlug;
        const verifyBase = `${webBaseUrl}/api/auth/verify-seller?token=${token}&email=${encodeURIComponent(session.user.email)}`;

        const dashboardUrl = `${verifyBase}&redirect=${encodeURIComponent(`/a/${storeSlug}`)}`;
        const connectInstagramUrl = `${verifyBase}&redirect=${encodeURIComponent(`/a/${storeSlug}/integrations`)}`;
        const storefrontUrl = `${webBaseUrl}/${storeSlug}`;

        // Send seller welcome email
        let emailSent = false;
        let emailError: string | null = null;
        try {
            await sendWelcomeEmail({
                to: session.user.email,
                name: session.user.name || data.personal?.fullName || "there",
                storefrontUrl,
                dashboardUrl,
                connectInstagramUrl,
            });
            emailSent = true;
        } catch (err) {
            emailError = err instanceof Error ? err.message : "Unknown email error";
            console.error("Failed to send welcome email:", err);
        }

        return NextResponse.json({ ...result, emailSent, emailError });
    } catch (error) {
        console.error("Onboarding error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to complete onboarding" },
            { status: 500 }
        );
    }
}
