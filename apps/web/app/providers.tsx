"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";

import type { PostHog } from "posthog-js";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isProd = process.env.NODE_ENV === "production";
  const [client, setClient] = React.useState<PostHog | null>(null);

  React.useEffect(() => {
    if (!isProd) return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    let cancelled = false;

    import("posthog-js")
      .then((m) => {
        const ph = m.default;
        ph.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          defaults: "2025-11-30",
        });
        if (!cancelled) setClient(ph);
      })
      .catch(() => {
        // Ignore analytics load failures
      });

    return () => {
      cancelled = true;
    };
  }, [isProd]);

  React.useEffect(() => {
    if (!isProd) return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    if (!client) return;

    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    client.capture("$pageview", {
      $current_url: url,
    });
  }, [isProd, pathname, searchParams, client]);

  if (!isProd || !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 2 minutes before marking as stale
            staleTime: 2 * 60 * 1000,
            // Keep inactive data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Refetch when window regains focus for fresh data
            refetchOnWindowFocus: false,
            // Only refetch if data is stale (avoid redundant calls in dev)
            refetchOnMount: false,
            // Single retry on failure
            retry: 1,
            // Don't retry on 4xx errors
            retryOnMount: true,
          },
          mutations: {
            // Show errors in console during development
            onError: (error) => {
              console.error("Mutation error:", error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
