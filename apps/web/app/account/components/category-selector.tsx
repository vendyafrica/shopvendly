"use client";

import { Checkbox } from "@shopvendly/ui/components/checkbox";
import { cn } from "@shopvendly/ui/lib/utils";
import { useOnboarding } from "../context/onboarding-context";
import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";

export type Category = {
  id: string;
  label: string;
};

const STEP_LABELS: Record<import("../context/onboarding-context").OnboardingStep, string> = {
  step0: "Sign in",
  step1: "Store Setup",
  complete: "Done",
};

export function StepIndicator() {
  const { currentStep, isHydrated } = useOnboarding();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps: import("../context/onboarding-context").OnboardingStep[] = ["step0", "step1", "complete"];

  const currentIndex = steps.indexOf(currentStep);
  const canAnimate = mounted && isHydrated;
  const showProgress = canAnimate && currentIndex >= 0;

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const isActive = showProgress && idx === currentIndex;
        const isComplete = showProgress && idx < currentIndex;
        const isPast = canAnimate && isComplete;

        return (
          <div key={step} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{
                  scale: canAnimate && isActive ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "relative flex items-center justify-center h-6 w-6 rounded-full border-2 transition-colors duration-300",
                  isPast
                    ? "bg-primary border-primary"
                    : isActive
                      ? "bg-white border-primary shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
                      : "bg-white border-border"
                )}
              >
                {isPast ? (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <motion.div
                    animate={{ scale: isActive && canAnimate ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="h-2 w-2 rounded-full bg-primary"
                  />
                )}
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-medium whitespace-nowrap transition-colors duration-300",
                  isActive && canAnimate
                    ? "text-foreground font-semibold"
                    : isPast
                      ? "text-primary"
                      : "text-muted-foreground/60"
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className="relative mx-2 mb-5 h-px w-12 md:w-16 bg-border overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ scaleX: isPast ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  style={{ transformOrigin: "left" }}
                  className="absolute inset-0 bg-primary"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface CategoriesSelectorProps {
  availableCategories: Category[];
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  maxSelections?: number;
}

export function CategoriesSelector({
  availableCategories,
  selectedCategories,
  onChange,
  maxSelections = 5,
}: CategoriesSelectorProps) {
  const toggle = (id: string) => {
    if (selectedCategories.includes(id)) {
      onChange(selectedCategories.filter((c) => c !== id));
    } else {
      if (selectedCategories.length >= maxSelections) return;
      onChange([...selectedCategories, id]);
    }
  };

  const atMax = selectedCategories.length >= maxSelections;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-4">
      {/* Count hint */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium text-muted-foreground">
        {selectedCategories.length === 0
          ? `Choose up to ${maxSelections}`
          : `${selectedCategories.length} of ${maxSelections} selected`}
      </motion.p>

      {/* Checkbox grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {availableCategories.map((cat) => {
          const checked = selectedCategories.includes(cat.id);
          const disabled = !checked && atMax;

          return (
            <motion.label
              key={cat.id}
              variants={item}
              whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              htmlFor={`cat-${cat.id}`}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors shadow-sm select-none",
                checked
                  ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                  : disabled
                    ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                    : "border-border/60 bg-card hover:border-primary/40 hover:bg-muted/40 hover:shadow-md"
              )}
            >
              <Checkbox
                id={`cat-${cat.id}`}
                checked={checked}
                onCheckedChange={() => toggle(cat.id)}
                disabled={disabled}
                className="shrink-0 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <span
                className={cn(
                  "text-sm font-medium leading-tight",
                  checked ? "text-primary" : "text-foreground"
                )}
              >
                {cat.label}
              </span>
            </motion.label>
          );
        })}
      </motion.div>
    </div>
  );
}