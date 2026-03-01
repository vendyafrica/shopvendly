"use client";

import * as React from "react";
import { trackStorefrontEvents } from "@/features/storefront/lib/storefront-tracking";
import { useAppSession } from "@/contexts/app-session-context";

export function StorefrontViewTracker({ storeSlug }: { storeSlug: string }) {
  const { session } = useAppSession();

  React.useEffect(() => {
    if (!storeSlug) return;
    void trackStorefrontEvents(
      storeSlug,
      [{ eventType: "store_view" }],
      { userId: session?.user?.id }
    );
  }, [storeSlug, session?.user?.id]);

  return null;
}
