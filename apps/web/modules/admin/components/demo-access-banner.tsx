"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Google } from "@shopvendly/ui/components/svgs/google";
import { signInWithGoogle } from "@shopvendly/auth/react";
import { useTenant } from "@/modules/admin/context/tenant-context";

export function DemoAccessBanner() {
  const { bootstrap } = useTenant();
  const pathname = usePathname();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const isDemoViewer = bootstrap?.storeSlug === "vendly" && !bootstrap?.canWrite;

  const handleLogin = async () => {
    if (!isDemoViewer || isSigningIn) return;

    try {
      setIsSigningIn(true);
      await signInWithGoogle({
        callbackURL: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : pathname,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!isDemoViewer) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">You&apos;re viewing the Vendly demo store</p>
            <p className="text-sm text-amber-900/80">
              Browse freely in demo mode. Sign in with your Google account for full access to edit products, customers, settings, and integrations.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleLogin}
          disabled={isSigningIn}
          className="h-10 rounded-xl px-4 font-semibold shadow-sm shadow-amber-200/50"
        >
          {isSigningIn ? (
            <>
              <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <Google />
              <span className="ml-2">Login for full access</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
