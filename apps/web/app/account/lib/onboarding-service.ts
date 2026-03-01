import { onboardingRepository } from "./onboarding-repository";
import {
  type OnboardingData,
  type OnboardingCompleteResponse,
  isValidPersonalInfo,
  isValidStoreInfo,
  isValidBusinessInfo,
} from "./models";

class OnboardingService {
  /**
   * Complete onboarding with full data submission
   */
  async createFullTenant(
    userId: string,
    email: string,
    data: OnboardingData
  ): Promise<OnboardingCompleteResponse> {
    // Validate all steps
    if (!data.personal || !isValidPersonalInfo(data.personal)) {
      throw new Error("Personal info incomplete");
    }
    if (!data.store || !isValidStoreInfo(data.store)) {
      throw new Error("Store info incomplete");
    }
    if (!data.business || !isValidBusinessInfo(data.business)) {
      throw new Error("Business info incomplete");
    }

    const result = await onboardingRepository.createTenantWithStore(
      userId,
      email,
      data as Required<OnboardingData>
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
