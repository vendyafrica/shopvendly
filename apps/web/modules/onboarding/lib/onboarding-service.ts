import { onboardingRepository } from "./onboarding-repository";
import {
    type OnboardingData,
    type OnboardingCompleteResponse,
    isValidPersonalInfo,
    isValidStoreInfo,
    isValidBusinessInfo,
} from "./models";

class OnboardingService {

    async createFullTenant(
        userId: string,
        email: string,
        data: OnboardingData,
        options?: { useExistingClaimedTenant?: boolean }
    ): Promise<OnboardingCompleteResponse> {
        if (!data.personal || !isValidPersonalInfo(data.personal)) {
            throw new Error("Personal info incomplete");
        }
        if (!data.store || !isValidStoreInfo(data.store)) {
            throw new Error("Store info incomplete");
        }

        // Business info is optional — default to empty categories if not provided
        const business = data.business ?? { categories: [] };

        const payloadData: OnboardingData = { ...data, business };

        const result = options?.useExistingClaimedTenant
            ? await onboardingRepository.completeClaimedTenant(
                userId,
                email,
                payloadData as Required<OnboardingData>
            )
            : await onboardingRepository.createTenantWithStore(
                userId,
                email,
                payloadData as Required<OnboardingData>
            );

        return {
            success: true,
            tenantId: result.tenant.id,
            storeId: result.store.id,
            storeSlug: result.store.slug,
            tenantSlug: result.tenant.slug,
            message: "Onboarding complete! Your store is ready.",
        };
    }
}

export const onboardingService = new OnboardingService();