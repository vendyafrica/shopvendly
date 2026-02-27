"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

export type TenantBootstrap = {
  tenantId: string;
  tenantSlug?: string;
  storeId: string;
  storeSlug: string;
  storeName?: string;
  defaultCurrency?: string;
};

type TenantContextValue = {
  bootstrap: TenantBootstrap | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

const TenantContext = React.createContext<TenantContextValue | undefined>(undefined);

async function fetchTenantBootstrap(storeSlug: string): Promise<TenantBootstrap> {
  const res = await fetch(`/api/admin/bootstrap?storeSlug=${encodeURIComponent(storeSlug)}`, {
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load tenant bootstrap (${res.status})`);
  }

  return res.json();
}

export function TenantProvider({
  children,
  initialBootstrap,
}: {
  children: React.ReactNode;
  initialBootstrap?: TenantBootstrap | null;
}) {
  const params = useParams();
  const storeSlug = params?.slug as string;

  const query = useQuery({
    queryKey: ["tenant-bootstrap", storeSlug],
    queryFn: () => fetchTenantBootstrap(storeSlug),
    initialData: initialBootstrap ?? undefined,
    enabled: Boolean(storeSlug),
  });

  const value = React.useMemo<TenantContextValue>(
    () => ({
      bootstrap: query.data ?? null,
      isLoading: query.isLoading,
      error: query.error instanceof Error ? query.error.message : query.error ? "Failed to load store context" : null,
      refetch: () => void query.refetch(),
    }),
    [query]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = React.useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}
