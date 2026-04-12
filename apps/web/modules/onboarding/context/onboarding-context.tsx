"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { PersonalInfoDto, StoreInfoDto, BusinessInfoDto, OnboardingData } from "../services/models";

// Re-export for convenience so consumers don't need a separate import
export type PersonalInfo = PersonalInfoDto;
export type StoreInfo = StoreInfoDto;
export type BusinessInfo = BusinessInfoDto;
export type { OnboardingData };

export type OnboardingStep = "step0" | "step1" | "step2" | "step3" | "complete";

interface OnboardingState {
    currentStep: OnboardingStep;
    data: OnboardingData;
    isComplete: boolean;
    isLoading: boolean;
    isHydrated: boolean;
    error: string | null;
}

interface OnboardingContextValue extends OnboardingState {
    savePersonalDraft: (info: PersonalInfo) => void;
    saveStoreDraft: (info: StoreInfo) => void;
    saveBusinessDraft: (info: BusinessInfo) => void;
    completeOnboarding: (dataOverride?: Partial<OnboardingData>) => Promise<boolean>;
    goBack: () => void;
    navigateToStep: (step: OnboardingStep) => void;
}

// ── localStorage helpers ────────────────────────────────────────────

const LS_DATA_KEY = "vendly_onboarding_data";
const LS_STEP_KEY = "vendly_onboarding_step";

function readLS(): OnboardingData {
    try {
        const raw = localStorage.getItem(LS_DATA_KEY);
        return raw ? (JSON.parse(raw) as OnboardingData) : {};
    } catch {
        return {};
    }
}

function readLSStep(): OnboardingStep {
    try {
        const stored = localStorage.getItem(LS_STEP_KEY) as OnboardingStep | null;
        if (!stored) return "step0";
        return stored;
    } catch {
        return "step0";
    }
}

function writeLS(data: OnboardingData, step?: OnboardingStep) {
    localStorage.setItem(LS_DATA_KEY, JSON.stringify(data));
    if (step) localStorage.setItem(LS_STEP_KEY, step);
}

function clearLS() {
    localStorage.removeItem(LS_DATA_KEY);
    localStorage.removeItem(LS_STEP_KEY);
}

// ── API helper ──────────────────────────────────────────────────────

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`/api/onboarding${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    const envelope = await res.json();

    if (!res.ok) {
        throw new Error(envelope.error || envelope.message || "API request failed");
    }

    return envelope.data ?? envelope;
}

// ── Context & hook ──────────────────────────────────────────────────

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error("useOnboarding must be used within OnboardingProvider");
    }
    return context;
}

const STEP_ROUTES: Record<Exclude<OnboardingStep, "complete">, string> & { complete: string } = {
    step0: "/account?step=0",
    step1: "/account?step=1",
    step2: "/account?step=2",
    step3: "/account?step=3",
    complete: "/admin",
};

// ── Provider ────────────────────────────────────────────────────────

interface ProviderProps {
    children: ReactNode;
}

export function OnboardingProvider({ children }: ProviderProps) {
    const router = useRouter();

    // Guard against double-submission (React StrictMode, fast navigations, etc.)
    const submittingRef = useRef(false);

    const [state, setState] = useState<OnboardingState>({
        currentStep: "step0",
        data: {},
        isComplete: false,
        isLoading: false,
        isHydrated: false,
        error: null,
    });

    // Rehydrate from localStorage after client mount (SSR can't access localStorage)
    useEffect(() => {
        if (typeof window === "undefined") return;
        
        const validateClaimToken = async () => {
            const claimToken = localStorage.getItem("vendly_claim_token");
            const claimEmail = localStorage.getItem("vendly_claim_email");

            if (claimToken && claimEmail) {
                try {
                    setState(prev => ({ ...prev, isLoading: true }));
                    
                    const res = await fetch("/api/auth/validate-claim-token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ token: claimToken, email: claimEmail }),
                    });

                    const rawResult = await res.json();
                    const result = rawResult.data ?? rawResult;

                    if (res.ok && result.success) {
                        // Store the claimed store info
                        localStorage.setItem("vendly_store_id", result.storeId);
                        localStorage.setItem("vendly_store_slug", result.storeSlug);
                        localStorage.setItem("vendly_tenant_id", result.tenantId);
                        
                        // Clear claim tokens
                        localStorage.removeItem("vendly_claim_token");
                        localStorage.removeItem("vendly_claim_email");
                        localStorage.removeItem("vendly_claim_redirect");
                        
                        // Pre-populate store name in onboarding data
                        const prefilledData: OnboardingData = {
                            store: {
                                storeName: result.storeName || "",
                                storeDescription: "",
                                storeLocation: "",
                            },
                        };
                        writeLS(prefilledData, "step1");
                        
                        setState(prev => ({
                            ...prev,
                            data: prefilledData,
                            currentStep: "step1",
                            isHydrated: true,
                            isLoading: false,
                        }));
                        
                        // Navigate to step 1 to continue onboarding
                        router.push("/account?step=1");
                        return;
                    } else {
                        console.error("Claim token validation failed:", result.error);
                        // Clear invalid tokens
                        localStorage.removeItem("vendly_claim_token");
                        localStorage.removeItem("vendly_claim_email");
                        localStorage.removeItem("vendly_claim_redirect");
                    }
                } catch (error) {
                    console.error("Error validating claim token:", error);
                    localStorage.removeItem("vendly_claim_token");
                    localStorage.removeItem("vendly_claim_email");
                    localStorage.removeItem("vendly_claim_redirect");
                }
            }
        };

        // Run claim token validation first
        void validateClaimToken().then(() => {
            // Then do normal hydration if no claim token was processed
            const claimToken = localStorage.getItem("vendly_claim_token");
            if (!claimToken) {
                const data = readLS();
                const storedStep = readLSStep();
                const search = new URLSearchParams(window.location.search);
                const stepParam = search.get("step");
                const map: Record<string, OnboardingStep> = {
                    "0": "step0",
                    "1": "step1",
                };
                const stepFromParam = stepParam ? map[stepParam] : undefined;
                const currentStep = stepFromParam ?? storedStep;
                setState(prev => ({
                    ...prev,
                    data,
                    currentStep,
                    isHydrated: true,
                }));
            }
        });
    }, [router]);

    // Persist state → localStorage whenever it changes (after hydration only)
    useEffect(() => {
        if (!state.isHydrated || state.isLoading) return;
        const hasData = state.data.personal || state.data.store || state.data.business;
        if (hasData) {
            writeLS(state.data, state.currentStep);
        }
    }, [state.data, state.currentStep, state.isLoading, state.isHydrated]);

    const navigateToStep = useCallback((step: OnboardingStep) => {
        setState(prev => ({ ...prev, currentStep: step }));
        router.push(STEP_ROUTES[step]);
    }, [router]);

    /**
     * Save personal + store info to localStorage before triggering Google OAuth.
     * This data is retrieved after the OAuth redirect completes.
     */
    const savePersonalDraft = useCallback((info: PersonalInfo) => {
        setState(prev => {
            const updatedData: OnboardingData = {
                ...prev.data,
                personal: info,
            };
            writeLS(updatedData, "step1");
            return { ...prev, data: updatedData, currentStep: "step1" };
        });
    }, []);

    const saveStoreDraft = useCallback((info: StoreInfo) => {
        setState(prev => {
            const updatedData: OnboardingData = {
                ...prev.data,
                store: info,
            };
            writeLS(updatedData, "step1");
            return { ...prev, data: updatedData, currentStep: "step1" };
        });
    }, []);

    const saveBusinessDraft = useCallback((business: BusinessInfo) => {
        setState(prev => {
            const updatedData: OnboardingData = {
                ...prev.data,
                business,
            };
            writeLS(updatedData, "step1");
            return { ...prev, data: updatedData, currentStep: "step1" };
        });
    }, []);

    /**
     * Finalize onboarding — sends all collected data to the API.
     * Uses in-memory state.data as the source of truth (not a fresh readLS()),
     * and guards against double-submission.
     */
    const completeOnboarding = useCallback(async (dataOverride?: Partial<OnboardingData>): Promise<boolean> => {
        // Prevent double-submission
        if (submittingRef.current) return false;
        submittingRef.current = true;

        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            // Use in-memory state merged with any overrides; fall back to localStorage
            // only as a safety net (e.g. after OAuth redirect before state rehydrates)
            const currentData = state.data;
            const hasInMemoryData = currentData.personal || currentData.store || currentData.business;
            const baseData = hasInMemoryData ? currentData : readLS();
            const payloadData: OnboardingData = { ...baseData, ...dataOverride };

            const result = await apiCall<{
                success: boolean;
                tenantId: string;
                tenantSlug: string;
                storeId: string;
                storeSlug: string;
                storefrontUrl?: string;
            }>("", {
                method: "POST",
                body: JSON.stringify({ data: payloadData }),
            });

            if (result.success) {
                localStorage.setItem("vendly_tenant_id", result.tenantId);
                localStorage.setItem("vendly_tenant_slug", result.tenantSlug);
                localStorage.setItem("vendly_store_id", result.storeId);
                localStorage.setItem("vendly_store_slug", result.storeSlug);
                if (result.storefrontUrl) {
                    localStorage.setItem("vendly_storefront_url", result.storefrontUrl);
                }

                clearLS();

                setState(prev => ({
                    ...prev,
                    currentStep: "complete",
                    isComplete: true,
                    isLoading: false,
                    data: {},
                }));

                router.push(`/admin/${result.storeSlug}`);
                return true;
            }

            setState(prev => ({ ...prev, isLoading: false }));
            submittingRef.current = false;
            return false;
        } catch (err) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err.message : "Failed to complete",
            }));
            submittingRef.current = false;
            return false;
        }
    }, [router, state.data]);

    const goBack = useCallback(() => {
        setState(prev => {
            const order: OnboardingStep[] = ["step0", "step1", "complete"];
            const currentIdx = order.indexOf(prev.currentStep);
            const previousIndex = currentIdx > 0 ? currentIdx - 1 : 0;
            const previousStep = order[previousIndex] ?? "step0";
            if (previousStep === prev.currentStep) return prev;
            router.push(STEP_ROUTES[previousStep]);
            return { ...prev, currentStep: previousStep };
        });
    }, [router]);

    const value: OnboardingContextValue = {
        ...state,
        savePersonalDraft,
        saveStoreDraft,
        saveBusinessDraft,
        completeOnboarding,
        goBack,
        navigateToStep,
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
}