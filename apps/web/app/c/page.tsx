"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useOnboarding } from "./context/onboarding-context";
import { Step1Info } from "./components/step1-info";
import { Step2Categories } from "./components/step2-categories";

export default function OnboardingRoute() {
  const { currentStep } = useOnboarding();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full"
      >
        {currentStep === "step2" ? <Step2Categories /> : <Step1Info />}
      </motion.div>
    </AnimatePresence>
  );
}