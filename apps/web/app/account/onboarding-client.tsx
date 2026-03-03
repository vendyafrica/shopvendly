"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnboarding } from "./context/onboarding-context";
import { Step0Auth } from "./components/step0-auth";
import { Step1Info } from "./components/step1-info";
import { Step2Store } from "./components/step2-store";
import { Step3Categories } from "./components/step3-categories";

export default function OnboardingClient() {
  const { currentStep } = useOnboarding();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderedStep = mounted ? currentStep : "step0";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={renderedStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full"
      >
        {renderedStep === "step0" && <Step0Auth />}
        {renderedStep === "step1" && <Step1Info />}
        {renderedStep === "step2" && <Step2Store />}
        {renderedStep === "step3" && <Step3Categories />}
      </motion.div>
    </AnimatePresence>
  );
}
