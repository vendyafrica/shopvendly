"use client";

import { Button } from "@shopvendly/ui/components/button";
import { GoogleIcon } from "@shopvendly/ui/components/svgs/google";
import { signInWithGoogle } from "@shopvendly/auth/react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { useOnboarding } from "../context/onboarding-context";
import { CategoriesSelector, type Category } from "../components/category-selector";
import { useAppSession } from "@/contexts/app-session-context";
import { getRootUrl } from "@/utils/misc";

const STATIC_CATEGORIES: Category[] = [
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
  { id: "food-and-drinks", label: "Food & Drinks" },
  { id: "accessories", label: "Accessories" },
  { id: "beauty-and-personal-care", label: "Beauty & Personal Care" },
  { id: "home-and-living", label: "Home & Living" },
  { id: "babies-and-toddlers", label: "Babies & Toddlers" },
  { id: "electronics", label: "Electronics" },
];

export function Step3Categories() {
  const { session: appSession } = useAppSession();
  const { data, completeOnboarding, goBack, isLoading, error, saveBusinessDraft } = useOnboarding();

  const [categories, setCategories] = useState<string[]>(data.business?.categories ?? []);
  const [authLoading, setAuthLoading] = useState(false);

  const getCallbackURL = useMemo(
    () => () => getRootUrl("/c?step=3"),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) return;
    // Persist categories before any auth redirect
    saveBusinessDraft({ categories });

    if (appSession?.user) {
      await completeOnboarding({ business: { categories } });
      return;
    }

    try {
      setAuthLoading(true);
      const res = await signInWithGoogle({ callbackURL: getCallbackURL() });
      if (res?.error) {
        console.error("Sign in failed:", res.error);
        setAuthLoading(false);
      }
    } catch {
      setAuthLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8 space-y-8 overflow-hidden">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-semibold tracking-tight">What do you sell?</h1>
        <p className="text-muted-foreground mt-1">
          Pick the categories that best describe your products.
        </p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </motion.div>
      )}

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <CategoriesSelector
          availableCategories={STATIC_CATEGORIES}
          selectedCategories={categories}
          onChange={setCategories}
          maxSelections={5}
        />

        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
          <Button type="button" variant="outline" size="lg" onClick={goBack} disabled={isLoading || authLoading} className="w-full md:w-auto">
            Back
          </Button>
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:w-auto">
            {appSession?.user ? (
              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full md:min-w-[200px] shadow-sm transition-all active:scale-[0.98]"
                disabled={isLoading || authLoading || categories.length === 0}
              >
                {isLoading ? "Setting up your store…" : "Finish setup"}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="outline"
                size="lg"
                className="w-full md:min-w-[200px] shadow-sm transition-all active:scale-[0.98] bg-white text-black hover:bg-gray-100 hover:text-black border-transparent"
                disabled={isLoading || authLoading || categories.length === 0}
              >
                {authLoading || isLoading ? (
                  "Continue with Google…"
                ) : (
                  <span className="flex items-center gap-2">
                    <GoogleIcon />
                    Continue with Google
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.form>
    </div>
  );
}