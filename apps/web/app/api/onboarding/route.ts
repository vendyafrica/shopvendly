import { NextRequest } from "next/server";
import { auth } from "@shopvendly/auth";
import { headers } from "next/headers";
import { onboardingService } from "@/modules/onboarding/services/onboarding-service";
import { onboardingRepository } from "@/modules/onboarding/services/onboarding-repository";
import type { OnboardingData } from "@/modules/onboarding/services/models";
import { onboardingRepo } from "@/modules/onboarding/repo/onboarding-repo";
import { sendWelcomeEmail } from "@shopvendly/transactional";
import { jsonSuccess, jsonError } from "@/shared/lib/api/response-utils";

export async function POST(req: NextRequest) {
    try {
        const configuredWebUrl =
            process.env.WEB_URL ||
            process.env.NEXT_PUBLIC_WEB_URL ||
            process.env.NEXT_PUBLIC_APP_URL;
        const origin = req.headers.get("origin")?.trim();
        const webBaseUrl = ((configuredWebUrl || origin)?.replace(/\/$/, "") || "https://shopvendly.store");
        const normalizedWebBaseUrl = webBaseUrl.includes("localhost") || webBaseUrl.startsWith("http")
            ? webBaseUrl
            : `https://${webBaseUrl}`;

        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return jsonError("Unauthorized", 401);

        const body = await req.json();
        const { data } = body as { data: OnboardingData };
        if (!data) return jsonError("Missing onboarding data", 400);

        const membershipBundle = await onboardingRepository.getMembershipWithTenantStore(session.user.id);

        if (membershipBundle) {
            const isFullyOnboarded =
                membershipBundle.tenant.status === "active" &&
                membershipBundle.tenant.onboardingStep === "complete";

            if (isFullyOnboarded) {
                const storefrontUrl = `${normalizedWebBaseUrl}/${membershipBundle.store.slug}`;
                return jsonSuccess({
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

        const { token } = await onboardingRepo.createVerificationToken(session.user.email);
        const storeSlug = result.storeSlug;
        const verifyBase = `${normalizedWebBaseUrl}/api/auth/verify-seller?token=${token}&email=${encodeURIComponent(session.user.email)}`;
        const adminUrl = `${verifyBase}&redirect=${encodeURIComponent(`/admin/${storeSlug}`)}`;
        const connectInstagramUrl = `${verifyBase}&redirect=${encodeURIComponent(`/admin/${storeSlug}/integrations`)}`;
        const storefrontUrl = `${normalizedWebBaseUrl}/${storeSlug}`;

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

        return jsonSuccess({ ...result, storefrontUrl, emailSent, emailError });
    } catch (error) {
        console.error("Onboarding error:", error);
        return jsonError(error instanceof Error ? error.message : "Failed to complete onboarding", 500);
    }
}
