"use client";

import * as React from "react";
import { Button } from "@shopvendly/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shopvendly/ui/components/select";
import { useTenant } from "@/features/dashboard/context/tenant-context";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type AllowedCurrency = "UGX" | "KES" | "USD";

const CURRENCY_OPTIONS: Array<{ value: AllowedCurrency; label: string }> = [
  { value: "UGX", label: "UGX" },
  { value: "KES", label: "KES" },
  { value: "USD", label: "USD" },
];

export function SettingsClient({
  store,
}: {
  store: {
    id: string;
    name: string;
    storeContactPhone: string | null;
    defaultCurrency: string;
  };
}) {
  const { refetch } = useTenant();

  const [currency, setCurrency] = React.useState<AllowedCurrency>(
    (store.defaultCurrency as AllowedCurrency) || "UGX"
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const onSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/stores/${encodeURIComponent(store.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultCurrency: currency }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error || "Failed to update currency");
      }

      setSuccess("Saved");
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update currency");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Store details</p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="text-xs uppercase text-muted-foreground">Store Name</div>
          <div className="text-base font-semibold text-foreground">{store.name || "—"}</div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="text-xs uppercase text-muted-foreground">Phone Number</div>
          <div className="text-base font-semibold text-foreground">{store.storeContactPhone || "—"}</div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="text-xs uppercase text-muted-foreground">Store Currency</div>
          <div className="flex items-center gap-3">
            <Select value={currency} onValueChange={(v) => setCurrency(v as AllowedCurrency)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
