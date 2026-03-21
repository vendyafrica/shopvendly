"use client";

import { useEffect, useRef } from "react";
import { signInWithOneTap } from "@shopvendly/auth/react";
import { useAppSession } from "@/contexts/app-session-context";
import { trackStorefrontEvents } from "@/app/[handle]/lib/storefront-tracking";

export function OneTapLogin({ storeSlug }: { storeSlug?: string }) {
  const { session } = useAppSession();
  const promptedRef = useRef(false);
  const successTrackedRef = useRef(false);

  useEffect(() => {
    if (!storeSlug) return;
    if (session?.user?.id) return;
    if (typeof window === "undefined") return;
    if (typeof navigator === "undefined") return;
    if (!window.isSecureContext && window.location.hostname !== "localhost") return;

    const timer = setTimeout(() => {
      const callbackURL = window.location.href;

      if (storeSlug) {
        promptedRef.current = true;
        void trackStorefrontEvents(
          storeSlug,
          [{ eventType: "signin_prompt_shown" }],
          { userId: session?.user?.id }
        );
      }

      void signInWithOneTap({ callbackURL })
        .catch((err) => {
          if (storeSlug) {
            void trackStorefrontEvents(
              storeSlug,
              [{ eventType: err?.name === "IdentityCredentialError" ? "signin_dismissed" : "signin_error" }],
              { userId: session?.user?.id }
            );
          }

          if (err?.name === "IdentityCredentialError") return;
          console.error(err);
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, [session?.user?.id, storeSlug]);

  useEffect(() => {
    if (!storeSlug) return;
    if (!session?.user?.id) {
      successTrackedRef.current = false;
      return;
    }
    if (!promptedRef.current) return;
    if (successTrackedRef.current) return;

    successTrackedRef.current = true;
    void trackStorefrontEvents(
      storeSlug,
      [{ eventType: "signin_success" }],
      { userId: session.user.id }
    );
  }, [storeSlug, session?.user?.id]);

  return null;
}
