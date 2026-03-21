"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@shopvendly/ui/components/button";
import { Textarea } from "@shopvendly/ui/components/textarea";
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
import { useUpload } from "@/modules/media/hooks/use-upload";

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
  storePolicy: string;
  logoUrl: string | null;
};

export function SettingsClient({ store }: { store: SettingsStore }) {
  const { bootstrap, refetch } = useTenant();
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const { uploadFile, isUploading } = useUpload();

  const [currency, setCurrency] = React.useState<AllowedCurrency>(
    (store.defaultCurrency as AllowedCurrency) || "UGX"
  );
  const [heroMedia, setHeroMedia] = React.useState<string[]>(() =>
    Array.isArray(store.heroMedia) ? store.heroMedia : []
  );
  const [storePolicy, setStorePolicy] = React.useState(store.storePolicy ?? "");
  const [logoUrl, setLogoUrl] = React.useState<string | null>(store.logoUrl ?? bootstrap?.storeLogoUrl ?? null);
  const [isSavingCurrency, setIsSavingCurrency] = React.useState(false);
  const [isSavingLogo, setIsSavingLogo] = React.useState(false);
  const [isSavingPolicy, setIsSavingPolicy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const storeId = bootstrap?.storeId ?? store.id;
  const isCurrencyBusy = isSavingCurrency;
  const isLogoBusy = isSavingLogo || isUploading;
  const isPolicyBusy = isSavingPolicy;

  React.useEffect(() => {
    setLogoUrl(store.logoUrl ?? bootstrap?.storeLogoUrl ?? null);
  }, [bootstrap?.storeLogoUrl, store.logoUrl]);

  React.useEffect(() => {
    setStorePolicy(store.storePolicy ?? "");
  }, [store.storePolicy]);

  const saveStore = async (
    payload: Record<string, unknown>,
    successMessage: string,
    mode: "currency" | "logo" | "policy"
  ) => {
    if (mode === "currency") {
      setIsSavingCurrency(true);
    } else if (mode === "policy") {
      setIsSavingPolicy(true);
    } else {
      setIsSavingLogo(true);
    }
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}`, {
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
      if (mode === "currency") {
        setIsSavingCurrency(false);
      } else if (mode === "policy") {
        setIsSavingPolicy(false);
      } else {
        setIsSavingLogo(false);
      }
    }
  };

  const onSave = async () => {
    try {
      await saveStore({ defaultCurrency: currency }, "Saved", "currency");
    } catch {
      return;
    }
  };

  const onSavePolicy = async () => {
    try {
      await saveStore({ storePolicy }, "Policy saved", "policy");
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

      await saveStore({ logoUrl: uploaded.url }, "Store logo updated", "logo");
      setLogoUrl(uploaded.url);
    } catch {
      return;
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await saveStore({ logoUrl: "" }, "Store logo removed", "logo");
      setLogoUrl(null);
    } catch {
      return;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 pb-24">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500">
          Manage core store details and storefront appearance.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 shadow-sm">
          {success}
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl space-y-10">
          
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Store Profile</h2>
            <p className="text-sm text-neutral-500">Basic information about your store.</p>
          </div>
          
          <div className="rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-5">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-1">Store Name</div>
                <div className="text-base font-medium text-neutral-900">{store.name || "—"}</div>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-5">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-1">Phone Number</div>
                <div className="text-base font-medium text-neutral-900">{store.storeContactPhone || "—"}</div>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-1">Store Logo</div>
                <p className="text-sm text-neutral-500 max-w-xs">Upload a square logo for your storefront header. SVG, PNG or JPG.</p>
              </div>
              
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoInputChange}
                disabled={!store.tenantId || isLogoBusy}
              />
              
              <div className="flex flex-col sm:items-end gap-4 shrink-0 mt-2 sm:mt-0">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={`${store.name} logo`}
                      fill
                      className="object-cover"
                      unoptimized={logoUrl.includes(".ufs.sh")}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-400">
                      <HugeiconsIcon icon={Image02Icon} size={28} strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-4 text-xs font-semibold rounded-xl"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={!store.tenantId || isLogoBusy}
                  >
                    {isLogoBusy ? "Uploading..." : logoUrl ? "Change logo" : "Upload logo"}
                  </Button>
                  {logoUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 px-3 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      onClick={handleRemoveLogo}
                      disabled={isLogoBusy}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Store Settings</h2>
            <p className="text-sm text-neutral-500">Currencies and policies for your checkout.</p>
          </div>
          
          <div className="rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-5">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-1">Store Currency</div>
                <p className="text-sm text-neutral-500 mb-3 sm:mb-0">The primary currency products are priced in.</p>
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center shrink-0">
                <Select value={currency} onValueChange={(v) => setCurrency(v as AllowedCurrency)}>
                  <SelectTrigger className="h-10 w-full sm:w-[140px] rounded-xl border-neutral-200 focus:ring-primary/20 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-200 shadow-xl">
                    {CURRENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="rounded-lg cursor-pointer">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button type="button" onClick={onSave} disabled={isCurrencyBusy} className="h-10 rounded-xl px-5 font-semibold">
                  {isSavingCurrency ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
                      Saving...
                    </>
                  ) : "Save"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500">Store Policy</div>
              </div>
              
              <Textarea
                value={storePolicy}
                onChange={(event) => setStorePolicy(event.target.value)}
                placeholder="Add your store policy for returns, exchanges, delivery timelines, and any special order terms."
                className="min-h-40 resize-y rounded-xl border-neutral-200 bg-neutral-50/50 p-4 focus-visible:ring-primary/20 text-sm leading-relaxed placeholder:text-neutral-400"
                disabled={isPolicyBusy}
              />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="text-xs text-neutral-500 max-w-sm">
                  This policy will appear below each product description
                </div>
                <Button type="button" onClick={onSavePolicy} disabled={isPolicyBusy} className="h-10 rounded-xl px-5 font-semibold shrink-0">
                  {isSavingPolicy ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
                      Saving...
                    </>
                  ) : "Save Policy"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Storefront Imagery</h2>
            <p className="text-sm text-neutral-500">Manage hero images and videos.</p>
          </div>
          
          <div id="storefront-header" className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <HeroEditor
              storeSlug={store.slug}
              tenantId={store.tenantId}
              heroMedia={heroMedia}
              onUpdate={setHeroMedia}
            />
          </div>
        </div>
        
        <div className="pt-4">
          <IntegrationsPanel />
        </div>

      </div>
    </div>
  );
}
