"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import { type CustomerRow } from "@/modules/admin/models";

async function fetchCustomers(storeId: string): Promise<CustomerRow[]> {
  const res = await fetch(`/api/admin/customers?storeId=${storeId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to load customers");
  }
  return (await res.json()).data;
}

export function useCustomers(storeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.list(storeId ?? ""),
    queryFn: () => fetchCustomers(storeId!),
    enabled: !!storeId,
  });
}
