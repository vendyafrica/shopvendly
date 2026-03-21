import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { onboardingService } from "@/modules/onboarding/lib/onboarding-service";
import { onboardingRepository } from "@/modules/onboarding/lib/onboarding-repository";
import type { OnboardingData } from "@/modules/onboarding/lib/models";
import { onboardingRepo } from "@/repo/onboarding-repo";
import { sendWelcomeEmail } from "@shopvendly/transactional";

export async function POST(req: Request) {
    try {
        const configuredWebUrl =
            process.env.WEB_URL ||
            process.env.NEXT_PUBLIC_WEB_URL ||
            process.env.NEXT_PUBLIC_APP_URL;
        const origin = req.headers.get("origin")?.trim();
        const fallbackProdUrl = "https://shopvendly.store";

        const webBaseUrl = (configuredWebUrl || origin)?.replace(/\/$/, "") || fallbackProdUrl;

        const normalizedWebBaseUrl = webBaseUrl.includes("localhost")
            ? webBaseUrl
            : webBaseUrl.startsWith("http")
            ? webBaseUrl
            : `https://${webBaseUrl}`;

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

        const membershipBundle = await onboardingRepository.getMembershipWithTenantStore(session.user.id);

        if (membershipBundle) {
            const isFullyOnboarded =
                membershipBundle.tenant.status === "active"
                && membershipBundle.tenant.onboardingStep === "complete";

            if (isFullyOnboarded) {
                const storefrontUrl = `${normalizedWebBaseUrl}/${membershipBundle.store.slug}`;
                return NextResponse.json({
                    success: true,
                    tenantId: membershipBundle.tenant.id,
                    storeId: membershipBundle.store.id,
                    storeSlug: membershipBundle.store.slug,
                    tenantSlug: membershipBundle.tenant.slug,
                    storefrontUrl,
                    message: "Already onboarded",
                    emailSent: false,
                    emailError: null,
                });
            }
        }

        const result = await onboardingService.createFullTenant(session.user.id, session.user.email, data, {
            useExistingClaimedTenant: Boolean(membershipBundle),
        });

        // Generate a single-use verification token for the welcome email (24h expiry)
        const { token } = await onboardingRepo.createVerificationToken(session.user.email);

        // Build URLs with embedded verification token
        const storeSlug = result.storeSlug;
        const verifyBase = `${normalizedWebBaseUrl}/api/auth/verify-seller?token=${token}&email=${encodeURIComponent(session.user.email)}`;

        const adminUrl = `${verifyBase}&redirect=${encodeURIComponent(`/admin/${storeSlug}`)}`;
        const connectInstagramUrl = `${verifyBase}&redirect=${encodeURIComponent(`/admin/${storeSlug}/integrations`)}`;
        const storefrontUrl = `${normalizedWebBaseUrl}/${storeSlug}`;

        // Send seller welcome email
        let emailSent = false;
        let emailError: string | null = null;
        try {
            await sendWelcomeEmail({
                to: session.user.email,
                name: session.user.name || data.personal?.fullName || "there",
                storefrontUrl,
                adminUrl,
                connectInstagramUrl,
            });
            emailSent = true;
        } catch (err) {
            emailError = err instanceof Error ? err.message : "Unknown email error";
            console.error("Failed to send welcome email:", err);
        }

        return NextResponse.json({ ...result, storefrontUrl, emailSent, emailError });
    } catch (error) {
        console.error("Onboarding error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to complete onboarding" },
            { status: 500 }
        );
    }
}
