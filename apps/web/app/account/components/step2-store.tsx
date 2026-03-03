"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@shopvendly/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@shopvendly/ui/components/field";
import { Input } from "@shopvendly/ui/components/input";
import { Textarea } from "@shopvendly/ui/components/textarea";

import { useOnboarding } from "../context/onboarding-context";
import { SectionLabel } from "./section-label";

export function Step2Store() {
  const { data, saveStoreDraft, navigateToStep, goBack, isHydrated } = useOnboarding();

  const [storeName, setStoreName] = useState(data.store?.storeName ?? "");
  const [storeLocation, setStoreLocation] = useState(data.store?.storeLocation ?? "");
  const [storeDescription, setStoreDescription] = useState(data.store?.storeDescription ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (data.store) {
      setStoreName(prev => prev || data.store!.storeName);
      setStoreLocation(prev => prev || data.store!.storeLocation);
      setStoreDescription(prev => prev || data.store!.storeDescription);
    }
  }, [isHydrated, data.store]);

  const handleSubmit = async () => {
    setError(null);
    if (!storeName.trim()) return setError("Please enter your store name.");
    if (!storeLocation.trim()) return setError("Please enter your store location.");

    setIsLoading(true);

    try {
      const checkRes = await fetch("/api/onboarding/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "storeName", value: storeName.trim() }),
      });
      const checkData = await checkRes.json();

      if (!checkData.available) {
        setIsLoading(false);
        return setError("This store name is already taken. Please choose another one.");
      }
    } catch (err) {
      console.error("Failed to check store name availability", err);
      setIsLoading(false);
      return setError("Could not verify store name. Please try again.");
    }

    saveStoreDraft({
      storeName: storeName.trim(),
      storeLocation: storeLocation.trim(),
      storeDescription: storeDescription.trim(),
    });

    navigateToStep("step3");
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8 space-y-8 overflow-hidden">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Your store basics</h1>
        <p className="text-muted-foreground mt-1">
          Add the details shoppers will see first.
        </p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </motion.div>
      )}

      <div className="space-y-8">
        <motion.div className="space-y-4" layout>
          <SectionLabel>2. Store details</SectionLabel>
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
                className="bg-muted/30 focus:bg-background transition-colors"
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
                className="bg-muted/30 focus:bg-background transition-colors"
              />
            </Field>
          </FieldGroup>

          <Field>
            <FieldLabel htmlFor="storeDescription">Store Description (optional)</FieldLabel>
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
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={isLoading}
            className="w-[80px]"
          >
            Back
          </Button>
          <Button
            type="button"
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
