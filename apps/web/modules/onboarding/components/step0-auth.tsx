"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@shopvendly/ui/components/button";
import { signInWithGoogle } from "@shopvendly/auth/react";
import { Google } from "@shopvendly/ui/components/svgs/google";
import { getRootUrl } from "@/shared/utils/misc";

export function Step0Auth() {
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleSignIn = async () => {
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Headline */}
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Start selling today
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          Create your store in under 2 minutes
        </motion.p>
      </div>

      {/* Google Sign-in */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={authLoading}
          className="w-full h-11 text-sm font-medium border-border/70 hover:border-border hover:bg-muted/40 transition-all duration-200 gap-3"
        >
          {authLoading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Connectingâ€¦
            </span>
          ) : (
            <>
              <Google />
              Continue with Google
            </>
          )}
        </Button>
      </motion.div>

      {/* Legal */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-6 text-center text-[11px] text-muted-foreground/70 leading-relaxed"
      >
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
      </motion.p>
    </motion.div>
  );
}
