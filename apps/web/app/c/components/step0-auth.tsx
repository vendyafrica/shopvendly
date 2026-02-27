"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@shopvendly/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@shopvendly/ui/components/field";
import { Input } from "@shopvendly/ui/components/input";
import { signInWithGoogle } from "@shopvendly/auth/react";
import { getRootUrl } from "@/utils/misc";
import Image from "next/image";

export function Step0Auth() {
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await signInWithGoogle({ callbackURL: getRootUrl("/c?step=1") });
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
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center mb-6">
              <div className="flex flex-col items-center gap-2 font-medium">
                <div className="flex size-8 items-center justify-center rounded-md">
                  <Image src="/vendly.png" alt="ShopVendly" width={24} height={24} />
                </div>
                <span className="sr-only">ShopVendly</span>
              </div>
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 size-4">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Continue with Google
              </Button>
            </Field>
          </FieldGroup>
        </form>
        <p className="px-6 text-center text-xs text-muted-foreground mt-6">
          By clicking continue, you agree to our <a href="#" className="underline hover:text-primary">Terms of Service</a>{" "}
          and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
}
