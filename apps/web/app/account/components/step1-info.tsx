"use client";

import { Button } from "@shopvendly/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@shopvendly/ui/components/field";
import { Input } from "@shopvendly/ui/components/input";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { useOnboarding } from "../context/onboarding-context";
import { PhoneInput } from "./phone-input";
import { SectionLabel } from "./section-label";

type FormState = "idle" | "loading";

function normalizePhone(countryCode: string, raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  let national = digits;
  if (digits.startsWith(countryCode)) national = digits.slice(countryCode.length);
  if (national.startsWith("0")) national = national.slice(1);
  if (!national) return null;
  return `+${countryCode}${national}`;
}

export function Step1Info() {
  const { savePersonalDraft, navigateToStep, data, isHydrated } = useOnboarding();

  const [fullName, setFullName] = useState(data.personal?.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(data.personal?.phoneNumber ?? "");
  const [countryCode, setCountryCode] = useState(data.personal?.countryCode ?? "256");
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);

  const isLoading = formState === "loading";

  useEffect(() => {
    if (!isHydrated) return;
    if (data.personal) {
      setFullName(prev => prev || data.personal!.fullName);
      setPhoneNumber(prev => prev || data.personal!.phoneNumber);
      setCountryCode(prev => prev || data.personal!.countryCode);
    }
  }, [isHydrated, data.personal]);

  const handleSubmit = async () => {
    setError(null);
    if (!fullName.trim()) return setError("Please enter your full name.");
    const normalizedPhone = normalizePhone(countryCode, phoneNumber);
    if (!normalizedPhone) return setError("Please enter a valid phone number.");

    savePersonalDraft({
      fullName: fullName.trim(),
      phoneNumber: normalizedPhone,
      countryCode,
    });

    setFormState("loading");
    navigateToStep("step2");
  };

  return (
    <div className="rounded-xl border bg-card justify-center items-center text-card-foreground shadow-sm p-6 md:p-8 space-y-8 overflow-hidden">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Tell us about you</h1>
        <p className="text-muted-foreground mt-1">
          Let&apos;s start with your basic contact information.
        </p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </motion.div>
      )}

      <div className="space-y-8">
        <motion.div className="space-y-4" layout>
          <SectionLabel>1. Personal Details</SectionLabel>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                className="h-10 bg-muted/30 focus:bg-background transition-colors"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
              <PhoneInput
                value={phoneNumber}
                countryCode={countryCode}
                onValueChange={setPhoneNumber}
                onCountryChange={setCountryCode}
                disabled={isLoading}
              />
            </Field>
          </FieldGroup>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-end gap-6 p-4">
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full md:w-auto min-w-[160px] shadow-sm transition-all active:scale-[0.98]"
          >
            {isLoading ? "Saving…" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}