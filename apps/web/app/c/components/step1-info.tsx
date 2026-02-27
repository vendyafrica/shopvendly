"use client";

import { Button } from "@shopvendly/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@shopvendly/ui/components/field";
import { Input } from "@shopvendly/ui/components/input";
import { Textarea } from "@shopvendly/ui/components/textarea";
import { Separator } from "@shopvendly/ui/components/separator";
import { Checkbox } from "@shopvendly/ui/components/checkbox";
import { Label } from "@shopvendly/ui/components/label";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useOnboarding } from "../context/onboarding-context";
import { useAppSession } from "@/contexts/app-session-context";
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
  const { session: appSession } = useAppSession();
  const { saveDraft, navigateToStep, data, isHydrated } = useOnboarding();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState(data.personal?.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(data.personal?.phoneNumber ?? "");
  const [countryCode, setCountryCode] = useState(data.personal?.countryCode ?? "256");
  const [storeName, setStoreName] = useState(data.store?.storeName ?? "");
  const [storeDescription, setStoreDescription] = useState(data.store?.storeDescription ?? "");
  const [storeLocation, setStoreLocation] = useState(data.store?.storeLocation ?? "");
  const [agreed, setAgreed] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);

  const isLoading = formState === "loading";

  // Sync form fields from localStorage data once hydration completes
  useEffect(() => {
    if (!isHydrated) return;
    if (data.personal) {
      setFullName(prev => prev || data.personal!.fullName);
      setPhoneNumber(prev => prev || data.personal!.phoneNumber);
      setCountryCode(prev => prev || data.personal!.countryCode);
    }
    if (data.store) {
      setStoreName(prev => prev || data.store!.storeName);
      setStoreDescription(prev => prev || data.store!.storeDescription);
      setStoreLocation(prev => prev || data.store!.storeLocation);
    }
  }, [isHydrated, data.personal, data.store]);

  useEffect(() => {
    if (appSession && searchParams.get("step") === "2") navigateToStep("step2");
  }, [appSession, navigateToStep, searchParams]);

  const handleSubmit = async () => {
    setError(null);
    if (!fullName.trim()) return setError("Please enter your full name.");
    if (!storeName.trim()) return setError("Please enter your store name.");
    const normalizedPhone = normalizePhone(countryCode, phoneNumber);
    if (!normalizedPhone) return setError("Please enter a valid phone number.");
    if (!agreed) return setError("Please agree to the Terms and Privacy Policy.");

    saveDraft({
      fullName: fullName.trim(),
      phoneNumber: normalizedPhone,
      countryCode,
      storeName: storeName.trim(),
      storeDescription: storeDescription.trim(),
      storeLocation: storeLocation.trim(),
    });

    setFormState("loading");
    navigateToStep("step2");
  };

  // Progressive disclosure triggers
  const isAboutYouFilled = fullName.trim().length >= 2 && phoneNumber.replace(/\D/g, "").length >= 7;
  const isStoreFilled = isAboutYouFilled && storeName.trim().length >= 2;

  // Refs for scrolling into view
  const storeRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAboutYouFilled && !isStoreFilled) {
      setTimeout(() => {
        storeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 300);
    }
  }, [isAboutYouFilled, isStoreFilled]);

  useEffect(() => {
    if (isStoreFilled) {
      setTimeout(() => {
        descRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 300);
    }
  }, [isStoreFilled]);

  const sectionVariants = {
    hidden: { opacity: 0, height: 0, y: 10 },
    visible: { opacity: 1, height: "auto", y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8 space-y-8 overflow-hidden">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Set up your seller account</h1>
        <p className="text-muted-foreground mt-1">
          Let&apos;s get to know you and your store. We&apos;ll build this together.
        </p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </motion.div>
      )}

      {/* ── Progressive Form Layout ── */}
      <div className="space-y-8">

        {/* step 1: About you */}
        <motion.div className="space-y-4" layout>
          <SectionLabel>1. About you</SectionLabel>
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
                className="h-11 bg-muted/30 focus:bg-background transition-colors"
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

        {/* step 2: Your store */}
        <AnimatePresence>
          {isAboutYouFilled && (
            <motion.div
              ref={storeRef}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-4 pt-4 border-t border-border/50"
            >
              <SectionLabel>2. Your store</SectionLabel>
              <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="storeName">Store Name</FieldLabel>
                  <Input
                    id="storeName"
                    type="text"
                    placeholder="E.g. Acme Fashion"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-muted/30 focus:bg-background transition-colors"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="storeLocation">Location</FieldLabel>
                  <Input
                    id="storeLocation"
                    type="text"
                    placeholder="E.g. Kampala, Uganda"
                    value={storeLocation}
                    onChange={(e) => setStoreLocation(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-muted/30 focus:bg-background transition-colors"
                  />
                </Field>
              </FieldGroup>
            </motion.div>
          )}
        </AnimatePresence>

        {/* step 3: Store Description & CTA */}
        <AnimatePresence>
          {isStoreFilled && (
            <motion.div
              ref={descRef}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-8 pt-4 border-t border-border/50"
            >
              <div className="space-y-4">
                <SectionLabel>3. Details (Optional)</SectionLabel>
                <Field>
                  <FieldLabel htmlFor="storeDescription">Store Description</FieldLabel>
                  <Textarea
                    id="storeDescription"
                    placeholder="Tell buyers what you sell and what makes your store special…"
                    rows={3}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    disabled={isLoading}
                    className="resize-none bg-muted/30 focus:bg-background transition-colors"
                  />
                </Field>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-muted/20 p-4 rounded-xl border border-border/40">
                <div className="flex items-start gap-3 w-full md:w-auto">
                  <Checkbox
                    id="terms"
                    checked={agreed}
                    onCheckedChange={(c) => setAgreed(!!c)}
                    disabled={isLoading}
                    className="mt-1 shadow-sm data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm font-normal text-muted-foreground leading-relaxed cursor-pointer select-none"
                  >
                    I agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isLoading || !agreed}
                  className="w-full md:w-auto min-w-[160px] shadow-sm transition-all active:scale-[0.98]"
                >
                  {isLoading ? "Saving…" : "Continue"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}