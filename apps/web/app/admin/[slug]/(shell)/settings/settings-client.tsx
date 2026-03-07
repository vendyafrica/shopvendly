"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@shopvendly/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shopvendly/ui/components/select";
import { useTenant } from "@/app/admin/context/tenant-context";
import { HeroEditor } from "../studio/components/hero-editor";
import { IntegrationsPanel } from "../../../components/integrations-panel";
import { useUpload } from "@/features/media/hooks/use-upload";

import { Image02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type AllowedCurrency = "UGX" | "KES" | "USD";

const CURRENCY_OPTIONS: Array<{ value: AllowedCurrency; label: string }> = [
  { value: "UGX", label: "UGX" },
  { value: "KES", label: "KES" },
  { value: "USD", label: "USD" },
];

type SettingsStore = {
  id: string;
  name: string;
  storeContactPhone: string | null;
  defaultCurrency: string;
  slug: string;
  tenantId: string | null;
  heroMedia: string[];
  logoUrl: string | null;
};

export function SettingsClient({ store }: { store: SettingsStore }) {
  const { refetch } = useTenant();
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const { uploadFile, isUploading } = useUpload();

  const [currency, setCurrency] = React.useState<AllowedCurrency>(
    (store.defaultCurrency as AllowedCurrency) || "UGX"
  );
  const [heroMedia, setHeroMedia] = React.useState<string[]>(() =>
    Array.isArray(store.heroMedia) ? store.heroMedia : []
  );
  const [logoUrl, setLogoUrl] = React.useState<string | null>(store.logoUrl ?? null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const isBusy = isSaving || isUploading;

  const saveStore = async (payload: Record<string, unknown>, successMessage: string) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/stores/${encodeURIComponent(store.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error || "Failed to update store settings");
      }

      setSuccess(successMessage);
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update store settings");
      throw e;
    } finally {
      setIsSaving(false);
    }
  };

  const onSave = async () => {
    try {
      await saveStore({ defaultCurrency: currency }, "Saved");
    } catch {
      return;
    }
  };

  const handleLogoInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    if (!store.tenantId) {
      setError("Store is still loading. Please try again in a moment.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const uploaded = await uploadFile(file, {
        tenantId: store.tenantId,
        endpoint: "storeHeroMedia",
      });

      await saveStore({ logoUrl: uploaded.url }, "Store logo updated");
      setLogoUrl(uploaded.url);
    } catch {
      return;
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await saveStore({ logoUrl: "" }, "Store logo removed");
      setLogoUrl(null);
    } catch {
      return;
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage core store details and storefront appearance.
        </p>
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

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.6fr]">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="text-xs uppercase text-muted-foreground">Store Name</div>
            <div className="text-base font-semibold text-foreground">{store.name || "—"}</div>
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="text-xs uppercase text-muted-foreground">Phone Number</div>
            <div className="text-base font-semibold text-foreground">{store.storeContactPhone || "—"}</div>
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="text-xs uppercase text-muted-foreground">Store Logo</div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoInputChange}
              disabled={!store.tenantId || isBusy}
            />
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border bg-muted">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`${store.name} logo`}
                    fill
                    className="object-cover"
                    unoptimized={logoUrl.includes(".ufs.sh")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <HugeiconsIcon icon={Image02Icon} size={22} />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={!store.tenantId || isBusy}
                >
                  {isUploading ? "Uploading..." : logoUrl ? "Change logo" : "Upload logo"}
                </Button>
                {logoUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRemoveLogo}
                    disabled={isBusy}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="text-xs uppercase text-muted-foreground">Store Currency</div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={currency} onValueChange={(v) => setCurrency(v as AllowedCurrency)}>
                <SelectTrigger className="sm:w-[220px]">
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

              <Button type="button" onClick={onSave} disabled={isBusy} className="sm:w-auto">
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

        <div id="storefront-header" className="space-y-4 rounded-xl bg-card/80">
          <HeroEditor
            storeSlug={store.slug}
            tenantId={store.tenantId}
            heroMedia={heroMedia}
            onUpdate={setHeroMedia}
          />
        </div>
      </div>

      <IntegrationsPanel />
    </div>
  );
}
