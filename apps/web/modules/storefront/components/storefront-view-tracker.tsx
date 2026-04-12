"use client";

import * as React from "react";
import { trackStorefrontEvents } from "@/modules/storefront/services/storefront-tracking";
import { useAppSession } from "@/shared/lib/app-session-context";

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
