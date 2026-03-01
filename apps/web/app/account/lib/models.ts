import { stores, tenantMemberships, tenants } from "@shopvendly/db";

export type OnboardingStep = "signup" | "personal" | "store" | "business" | "complete";

export interface PersonalInfoDto {
  fullName: string;
  phoneNumber: string;
  countryCode: string;
}

export interface StoreInfoDto {
  storeName: string;
  storeDescription: string;
  storeLocation: string;
}

export interface BusinessInfoDto {
  categories: string[];
}

// Convenience aliases used by the onboarding context
export type PersonalInfo = PersonalInfoDto;
export type StoreInfo = StoreInfoDto;
export type BusinessInfo = BusinessInfoDto;

export interface OnboardingData {
  personal?: PersonalInfoDto;
  store?: StoreInfoDto;
  business?: BusinessInfoDto;
}

export interface OnboardingStatusResponse {
  currentStep: OnboardingStep;
  data: OnboardingData;
  isComplete: boolean;
}

export interface StepSaveResponse {
  success: boolean;
  nextStep: OnboardingStep;
  message: string;
}

export interface OnboardingCompleteResponse {
  success: boolean;
  tenantId: string;
  storeId: string;
  storeSlug: string;
  tenantSlug: string;
  message: string;
}

export interface TenantWithOnboarding {
  id: string;
  fullName: string;
  slug: string;
  phoneNumber: string | null;
  onboardingStep: OnboardingStep;
  onboardingData: OnboardingData;
}

export interface CreateTenantResult {
  tenant: typeof tenants.$inferSelect;
  store: typeof stores.$inferSelect;
  membership: typeof tenantMemberships.$inferSelect;
}

export function isValidPersonalInfo(data: unknown): data is PersonalInfoDto {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.fullName === "string" &&
    d.fullName.trim().length > 0 &&
    typeof d.phoneNumber === "string" &&
    d.phoneNumber.trim().length > 0 &&
    typeof d.countryCode === "string" &&
    d.countryCode.trim().length > 0
  );
}

export function isValidStoreInfo(data: unknown): data is StoreInfoDto {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.storeName === "string" &&
    d.storeName.trim().length > 0 &&
    typeof d.storeDescription === "string"
  );
}

export function isValidBusinessInfo(data: unknown): data is BusinessInfoDto {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.categories) &&
    d.categories.length > 0 &&
    d.categories.every((c: unknown) => typeof c === "string")
  );
}
