"use client";

import { Button } from "@shopvendly/ui/components/button";
import { useState } from "react";
import { motion } from "framer-motion";

import { useOnboarding } from "../context/onboarding-context";
import { CategoriesSelector, type Category } from "./category-selector";

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
  const {
    data,
    completeOnboarding,
    goBack,
    isLoading,
    error,
    saveBusinessDraft,
  } = useOnboarding();

  const [categories, setCategories] = useState<string[]>(
    data.business?.categories ?? [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) return;
    saveBusinessDraft({ categories });
    await completeOnboarding({ business: { categories } });
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8 space-y-8 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-lg font-semibold tracking-tight">
          What do you sell?
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pick the categories that best describe your products.
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
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

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={isLoading}
            className="w-[120px] md:w-auto"
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-[160px] md:min-w-[180px] shadow-sm transition-all active:scale-[0.98]"
            disabled={isLoading || categories.length === 0}
          >
            {isLoading ? "Setting up your store…" : "Finish setup"}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
