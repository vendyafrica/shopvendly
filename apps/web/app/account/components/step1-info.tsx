"use client";

import { Button } from "@shopvendly/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@shopvendly/ui/components/field";
import { Input } from "@shopvendly/ui/components/input";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { useOnboarding } from "../context/onboarding-context";
import { PhoneInput } from "./phone-input";

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

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export function Step1Info() {
  const { completeOnboarding, data, isHydrated } = useOnboarding();

  const [storeName, setStoreName] = useState(data.store?.storeName ?? "");
  const [businessName, setBusinessName] = useState(data.personal?.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(data.personal?.phoneNumber ?? "");
  const [countryCode, setCountryCode] = useState(data.personal?.countryCode ?? "256");
  const [formState, setFormState] = useState<FormState>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isLoading = formState === "loading";

  useEffect(() => {
    if (!isHydrated) return;
    if (data.store?.storeName) setStoreName(prev => prev || data.store!.storeName);
    if (data.personal?.fullName) setBusinessName(prev => prev || data.personal!.fullName);
    if (data.personal?.phoneNumber) setPhoneNumber(prev => prev || data.personal!.phoneNumber);
    if (data.personal?.countryCode) setCountryCode(prev => prev || data.personal!.countryCode);
  }, [isHydrated, data.store?.storeName, data.personal?.fullName, data.personal?.phoneNumber, data.personal?.countryCode]);

  // Auto-fill business name from store name on first entry
  useEffect(() => {
    if (storeName && !businessName) {
      setBusinessName(storeName);
    }
  }, [storeName, businessName]);

  const handleSubmit = async () => {
    setFieldErrors({});

    if (!storeName.trim()) {
      setFieldErrors(prev => ({ ...prev, storeName: "Store name is required" }));
      return;
    }
    if (!businessName.trim()) {
      setFieldErrors(prev => ({ ...prev, businessName: "Business name is required" }));
      return;
    }
    const normalizedPhone = normalizePhone(countryCode, phoneNumber);
    if (!normalizedPhone) {
      setFieldErrors(prev => ({ ...prev, phone: "Please enter a valid phone number" }));
      return;
    }

    setFormState("loading");

    try {
      const [storeCheckRes, phoneCheckRes] = await Promise.all([
        fetch("/api/onboarding/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "storeName", value: storeName.trim() }),
        }),
        fetch("/api/onboarding/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "phone", value: normalizedPhone }),
        }),
      ]);

      const storeCheckData = await storeCheckRes.json();
      const phoneCheckData = await phoneCheckRes.json();

      if (!storeCheckData.available) {
        setFormState("idle");
        return setFieldErrors(prev => ({ ...prev, storeName: "This store name is already taken" }));
      }
      if (!phoneCheckData.available) {
        setFormState("idle");
        return setFieldErrors(prev => ({ ...prev, phone: "This phone number is already registered" }));
      }

      await completeOnboarding({
        personal: { fullName: businessName.trim(), phoneNumber: normalizedPhone, countryCode },
        store: { storeName: storeName.trim(), storeDescription: "", storeLocation: "" },
        business: { categories: [] },
      });
    } catch (err) {
      console.error("Failed to complete onboarding", err);
      setFormState("idle");
      setFieldErrors(prev => ({ ...prev, general: "Something went wrong. Please try again." }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Set up your store
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="mt-1.5 text-sm text-muted-foreground"
        >
          Just three things and you&apos;re in
        </motion.p>
      </div>

      {/* General error */}
      {fieldErrors.general && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
        >
          {fieldErrors.general}
        </motion.div>
      )}

      {/* Fields */}
      <FieldGroup className="space-y-5">

        {/* Store Name */}
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
          <Field>
            <FieldLabel htmlFor="storeName" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Store Name
            </FieldLabel>
            <div className="mt-1.5">
              <Input
                id="storeName"
                type="text"
                placeholder="e.g. Fashion Haven"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-muted/30 focus:bg-background transition-colors border-border/60 focus-visible:border-primary focus-visible:ring-primary/20"
              />
              {fieldErrors.storeName && (
                <p className="mt-1.5 text-xs text-destructive">{fieldErrors.storeName}</p>
              )}
            </div>
          </Field>
        </motion.div>

        {/* Business Name */}
        <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
          <Field>
            <FieldLabel htmlFor="businessName" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Business Name
            </FieldLabel>
            <div className="mt-1.5">
              <Input
                id="businessName"
                type="text"
                placeholder="Your trading / legal name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-muted/30 focus:bg-background transition-colors border-border/60 focus-visible:border-primary focus-visible:ring-primary/20"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground/70">Appears on invoices and receipts</p>
              {fieldErrors.businessName && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.businessName}</p>
              )}
            </div>
          </Field>
        </motion.div>

        {/* Phone Number */}
        <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
          <Field>
            <FieldLabel htmlFor="phoneNumber" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Phone Number
            </FieldLabel>
            <div className="mt-1.5">
              <PhoneInput
                value={phoneNumber}
                countryCode={countryCode}
                onValueChange={setPhoneNumber}
                onCountryChange={setCountryCode}
                disabled={isLoading}
              />
              {fieldErrors.phone && (
                <p className="mt-1.5 text-xs text-destructive">{fieldErrors.phone}</p>
              )}
            </div>
          </Field>
        </motion.div>

      </FieldGroup>

      {/* CTA */}
      <motion.div
        custom={3}
        variants={fieldVariants}
        initial="hidden"
        animate="show"
        className="mt-8"
      >
        <Button
          type="button"
          size="lg"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full h-11 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating your store…
            </span>
          ) : (
            "Create Store →"
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
