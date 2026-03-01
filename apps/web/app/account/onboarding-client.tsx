"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useOnboarding } from "./context/onboarding-context";
import { Step0Auth } from "./components/step0-auth";
import { Step1Info } from "./components/step1-info";
import { Step2Store } from "./components/step2-store";
import { Step3Categories } from "./components/step3-categories";

export default function OnboardingClient() {
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
        {currentStep === "step0" && <Step0Auth />}
        {currentStep === "step1" && <Step1Info />}
        {currentStep === "step2" && <Step2Store />}
        {currentStep === "step3" && <Step3Categories />}
      </motion.div>
    </AnimatePresence>
  );
}
