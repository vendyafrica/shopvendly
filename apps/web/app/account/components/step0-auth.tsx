"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@shopvendly/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@shopvendly/ui/components/field";
import { Input } from "@shopvendly/ui/components/input";
import { signInWithGoogle } from "@shopvendly/auth/react";
import { Google } from "@shopvendly/ui/components/svgs/google";
import { getRootUrl } from "@/utils/misc";

export function Step0Auth() {
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await signInWithGoogle({
        callbackURL: getRootUrl("/account?step=1"),
      });
      if (res?.error) {
        console.error("Sign in failed:", res.error);
        setAuthLoading(false);
      }
    } catch {
      setAuthLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center mb-6">
              <div className="flex flex-col items-center gap-2 font-medium"></div>
              <h1 className="text-xl font-bold">Welcome to ShopVendly</h1>
              <p className="text-sm text-muted-foreground">
                Get started with your store today
              </p>
            </div>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={authLoading}
                required
              />
            </Field>

            <Field className="mt-2">
              <Button type="submit" disabled={authLoading} className="w-full">
                {authLoading ? "Continuing..." : "Continue"}
              </Button>
            </Field>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Field className="grid gap-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleSubmit()}
                disabled={authLoading}
              >
                <Google />
                Continue with Google
              </Button>
            </Field>
          </FieldGroup>
        </form>
        <p className="px-6 text-center text-xs text-muted-foreground mt-6">
          By clicking continue, you agree to our{" "}
          <a href="#" className="underline hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </motion.div>
    </div>
  );
}
