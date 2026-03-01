"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function usePrefetchAccount(enabled = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    router.prefetch("/account?step=0");
    fetch("/api/onboarding/status", { credentials: "include" }).catch(() => {});
  }, [enabled, router]);
}
