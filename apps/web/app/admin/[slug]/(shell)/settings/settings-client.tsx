"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@shopvendly/ui/components/button";
import { Textarea } from "@shopvendly/ui/components/textarea";
import { Switch } from "@shopvendly/ui/components/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shopvendly/ui/components/select";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { HeroEditor } from "../studio/components/hero-editor";
import { IntegrationsPanel } from "@/modules/admin/components/integrations-panel";
import { useUpload } from "@/modules/media/hooks/use-upload";

import { ArrowRight01Icon, Image02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
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
  collectoPassTransactionFeeToCustomer: boolean;
  collectoPayoutMode: "automatic_per_order" | "manual_batch";
};

type CollectoBalanceSummary = {
  availableBalance: number;
  payoutAmount: number;
  payoutFee: number;
  orderCount: number;
  orderIds: string[];
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
  const [passTransactionFeeToCustomer, setPassTransactionFeeToCustomer] = React.useState(Boolean(store.collectoPassTransactionFeeToCustomer));
  const [collectoPayoutMode, setCollectoPayoutMode] = React.useState<"automatic_per_order" | "manual_batch">(
    store.collectoPayoutMode || bootstrap?.collectoPayoutMode || "automatic_per_order"
  );
  const [collectoBalance, setCollectoBalance] = React.useState<CollectoBalanceSummary | null>(null);
  const [isCollectoLoading, setIsCollectoLoading] = React.useState(false);
  const [isSavingCollecto, setIsSavingCollecto] = React.useState(false);
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

  React.useEffect(() => {
    setPassTransactionFeeToCustomer(Boolean(store.collectoPassTransactionFeeToCustomer));
    setCollectoPayoutMode(store.collectoPayoutMode || bootstrap?.collectoPayoutMode || "automatic_per_order");
  }, [bootstrap?.collectoPayoutMode, store.collectoPassTransactionFeeToCustomer, store.collectoPayoutMode]);

  React.useEffect(() => {
    let cancelled = false;

    const loadCollectoBalance = async () => {
      if (collectoPayoutMode !== "manual_batch" || !storeId) {
        setCollectoBalance(null);
        return;
      }

      setIsCollectoLoading(true);
      try {
        const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}/collecto/available-balance`, { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as CollectoBalanceSummary & { error?: string } | null;

        if (!cancelled && res.ok && json) {
          setCollectoBalance({
            availableBalance: json.availableBalance ?? 0,
            payoutAmount: json.payoutAmount ?? 0,
            payoutFee: json.payoutFee ?? 1200,
            orderCount: json.orderCount ?? 0,
            orderIds: Array.isArray(json.orderIds) ? json.orderIds : [],
          });
        }
      } finally {
        if (!cancelled) {
          setIsCollectoLoading(false);
        }
      }
    };

    void loadCollectoBalance();
    return () => {
      cancelled = true;
    };
  }, [collectoPayoutMode, storeId]);

  const saveStore = async (
    payload: Record<string, unknown>,
    successMessage: string,
    mode: "currency" | "logo" | "policy" | "collecto"
  ) => {
    if (mode === "currency") {
      setIsSavingCurrency(true);
    } else if (mode === "policy") {
      setIsSavingPolicy(true);
    } else if (mode === "collecto") {
      setIsSavingCollecto(true);
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
      } else if (mode === "collecto") {
        setIsSavingCollecto(false);
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

  const onSaveCollecto = async () => {
    try {
      await saveStore(
        {
          collectoPassTransactionFeeToCustomer: passTransactionFeeToCustomer,
          collectoPayoutMode,
        },
        "Collecto preferences saved",
        "collecto"
      );
      await refetch();
    } catch {
      return;
    }
  };

  const handleManualPayout = async () => {
    try {
      setError(null);
      setSuccess(null);
      const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}/collecto/initiate-payout`, { method: "POST" });
      const data = await res.json().catch(() => null) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || "Failed to trigger payout");
      }
      setSuccess("Manual payout initiated.");
      await refetch();
      const balanceRes = await fetch(`/api/stores/${encodeURIComponent(storeId)}/collecto/available-balance`, { cache: "no-store" });
      const balanceData = (await balanceRes.json().catch(() => null)) as CollectoBalanceSummary | null;
      if (balanceRes.ok && balanceData) {
        setCollectoBalance(balanceData);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to trigger payout");
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
        <p className="text-sm text-neutral-500">Manage core store details, storefront appearance, and Collecto payout controls.</p>
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
            <p className="text-sm text-neutral-500">Currencies, policies, and payout preferences for your checkout.</p>
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
            <h2 className="text-lg font-semibold text-neutral-900">Collecto Payout Controls</h2>
            <p className="text-sm text-neutral-500">Choose who pays the fee and whether payouts happen automatically or manually.</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm">
            <div className="flex flex-col gap-5 p-5 border-b border-neutral-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-1">Pass Collecto fee to customer</div>
                <p className="text-sm text-neutral-500 max-w-lg">When enabled, the customer will see the 3% Collecto fee in checkout and your store receives the gross payment minus Collecto&apos;s collection fee.</p>
              </div>
              <Switch checked={passTransactionFeeToCustomer} onCheckedChange={(checked) => setPassTransactionFeeToCustomer(Boolean(checked))} />
            </div>

            <div className="flex flex-col gap-4 p-5 border-b border-neutral-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-1">Payout mode</div>
                <p className="text-sm text-neutral-500 max-w-lg">Automatic payout moves money all the way to you after each order. Manual payout holds seller payouts until you trigger them.</p>
              </div>
              <Select value={collectoPayoutMode} onValueChange={(value) => setCollectoPayoutMode(value as "automatic_per_order" | "manual_batch") }>
                <SelectTrigger className="h-10 w-full sm:w-[220px] rounded-xl border-neutral-200 focus:ring-primary/20 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 shadow-xl">
                  <SelectItem value="automatic_per_order" className="rounded-lg cursor-pointer">Automatic per order</SelectItem>
                  <SelectItem value="manual_batch" className="rounded-lg cursor-pointer">Manual batch payout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-1">Current payout summary</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="text-[11px] uppercase tracking-widest text-neutral-500">Available balance</div>
                    <div className="mt-1 text-lg font-semibold text-neutral-900">UGX {(collectoBalance?.availableBalance ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="text-[11px] uppercase tracking-widest text-neutral-500">Payout after fee</div>
                    <div className="mt-1 text-lg font-semibold text-neutral-900">UGX {(collectoBalance?.payoutAmount ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="text-[11px] uppercase tracking-widest text-neutral-500">Orders waiting</div>
                    <div className="mt-1 text-lg font-semibold text-neutral-900">{isCollectoLoading ? "..." : (collectoBalance?.orderCount ?? 0)}</div>
                  </div>
                </div>
                <p className="text-xs text-neutral-500">
                  {collectoPayoutMode === "manual_batch"
                    ? `Manual payout mode is active. Collecto holds seller payouts until you trigger them. ${collectoBalance?.orderCount ? `${collectoBalance.orderCount} order(s) are ready.` : "No payout is currently waiting."}`
                    : "Automatic payout mode is active. Orders settle without manual intervention."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={onSaveCollecto} disabled={isSavingCollecto} className="h-10 rounded-xl px-5 font-semibold">
                  {isSavingCollecto ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
                      Saving...
                    </>
                  ) : (
                    "Save payout settings"
                  )}
                </Button>
                {collectoPayoutMode === "manual_batch" ? (
                  <Button type="button" variant="outline" onClick={handleManualPayout} disabled={isCollectoLoading} className="h-10 rounded-xl px-5 font-semibold">
                    Trigger payout
                    <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 h-4 w-4" />
                  </Button>
                ) : null}
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
