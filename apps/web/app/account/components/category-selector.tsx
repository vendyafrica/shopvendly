"use client";

import { Checkbox } from "@shopvendly/ui/components/checkbox";
import { cn } from "@shopvendly/ui/lib/utils";
import { useOnboarding } from "../context/onboarding-context";
import { motion, type Variants } from "framer-motion";

export type Category = {
  id: string;
  label: string;
};

const STEP_LABELS: Record<import("../context/onboarding-context").OnboardingStep, string> = {
  step0: "Sign in",
  step1: "Personal",
  step2: "Store",
  step3: "Categories",
  complete: "Done",
};

export function StepIndicator() {
  const { currentStep, isHydrated } = useOnboarding();

  const steps: import("../context/onboarding-context").OnboardingStep[] = ["step0", "step1", "step2", "step3", "complete"];

  const currentIndex = steps.indexOf(currentStep);

  if (!isHydrated) {
    return (
      <div className="w-full overflow-x-auto md:overflow-visible">
        <div className="flex items-center gap-3 text-[11px] md:text-xs font-medium text-muted-foreground min-w-max pr-2">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full border bg-muted border-border" />
              <span>{STEP_LABELS[step]}</span>
              {idx < steps.length - 1 && <div className="h-px w-6 bg-border" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto md:overflow-visible">
      <div className="flex items-center gap-3 text-[11px] md:text-xs font-medium text-muted-foreground min-w-max pr-2">
        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isComplete = idx < currentIndex;
          return (
            <div key={step} className="flex items-center gap-2">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  backgroundColor: isActive || isComplete ? "var(--primary)" : "transparent"
                }}
                className={cn(
                  "h-2.5 w-2.5 rounded-full border",
                  isActive || isComplete ? "border-primary" : "border-border"
                )}
              />
              <span className={cn(isActive ? "text-foreground font-semibold" : "")}>{STEP_LABELS[step]}</span>
              {idx < steps.length - 1 && <div className="h-px w-6 bg-border/50" />}
            </div>
          );
        })}
      </div>
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