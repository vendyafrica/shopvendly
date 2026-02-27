"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { PersonalInfo, StoreInfo, BusinessInfo, OnboardingData } from "../lib/models";

// Re-export for convenience so consumers don't need a separate import
export type { PersonalInfo, StoreInfo, BusinessInfo, OnboardingData };

export type OnboardingStep = "step0" | "step1" | "step2" | "complete";

interface OnboardingState {
    currentStep: OnboardingStep;
    data: OnboardingData;
    isComplete: boolean;
    isLoading: boolean;
    isHydrated: boolean;
    error: string | null;
}

interface OnboardingContextValue extends OnboardingState {
    saveDraft: (info: PersonalInfo & StoreInfo) => void;
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
        if (!stored || stored === "step0") return "step1";
        return stored;
    } catch {
        return "step1";
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

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || data.message || "API request failed");
    }

    return data;
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

const STEP_ROUTES: Record<OnboardingStep, string> = {
    step0: "/c?step=1",
    step1: "/c?step=1",
    step2: "/c?step=2",
    complete: "/c/complete",
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
        currentStep: "step1",
        data: {},
        isComplete: false,
        isLoading: false,
        isHydrated: false,
        error: null,
    });

    // Rehydrate from localStorage after client mount (SSR can't access localStorage)
    useEffect(() => {
        if (typeof window === "undefined") return;
        const data = readLS();
        const currentStep = readLSStep();
        setState(prev => ({
            ...prev,
            data,
            currentStep,
            isHydrated: true,
        }));
    }, []);

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
    const saveDraft = useCallback((info: PersonalInfo & StoreInfo) => {
        const { fullName, phoneNumber, countryCode, storeName, storeDescription, storeLocation } = info;
        setState(prev => {
            const updatedData: OnboardingData = {
                ...prev.data,
                personal: { fullName, phoneNumber, countryCode },
                store: { storeName, storeDescription, storeLocation },
            };
            writeLS(updatedData, "step1");
            return { ...prev, data: updatedData };
        });
    }, []);

    const saveBusinessDraft = useCallback((business: BusinessInfo) => {
        setState(prev => {
            const updatedData: OnboardingData = {
                ...prev.data,
                business,
            };
            writeLS(updatedData, "step2");
            return { ...prev, data: updatedData };
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
            }>("", {
                method: "POST",
                body: JSON.stringify({ data: payloadData }),
            });

            if (result.success) {
                localStorage.setItem("vendly_tenant_id", result.tenantId);
                localStorage.setItem("vendly_tenant_slug", result.tenantSlug);
                localStorage.setItem("vendly_store_id", result.storeId);
                localStorage.setItem("vendly_store_slug", result.storeSlug);

                clearLS();

                setState(prev => ({
                    ...prev,
                    currentStep: "complete",
                    isComplete: true,
                    isLoading: false,
                    data: {},
                }));

                router.push(STEP_ROUTES["complete"]);
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
        navigateToStep("step1");
    }, [navigateToStep]);

    const value: OnboardingContextValue = {
        ...state,
        saveDraft,
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
