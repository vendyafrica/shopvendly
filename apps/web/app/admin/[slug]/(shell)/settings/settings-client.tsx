"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@shopvendly/ui/components/button";
import { Textarea } from "@shopvendly/ui/components/textarea";
import { Switch } from "@shopvendly/ui/components/switch";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@shopvendly/ui/components/combobox";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { HeroEditor } from "../studio/components/hero-editor";
import { IntegrationsPanel } from "@/modules/admin/components/integrations-panel";
import { useUpload } from "@/modules/media/hooks/use-upload";
import { signInWithGoogle } from "@shopvendly/auth/react";
import { Google } from "@shopvendly/ui/components/svgs/google";

import { 
  AlertCircleIcon,
  ArrowRight01Icon, 
  Image02Icon, 
  Loading03Icon,
  Settings02Icon, 
  LegalIcon, 
  Wallet02Icon, 
  Layout01Icon, 
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type AllowedCurrency = "UGX" | "KES" | "USD";

const CURRENCY_OPTIONS: Array<{ value: AllowedCurrency; label: string }> = [
  { value: "UGX", label: "UGX" },
  { value: "KES", label: "KES" },
  { value: "USD", label: "USD" },
];

const PAYOUT_MODE_OPTIONS = [
  { value: "automatic_per_order", label: "Automatic per order" },
  { value: "manual_batch", label: "Manual batch payout" },
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
  const pathname = usePathname();
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const { uploadFile, isUploading } = useUpload();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

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
  const isDemoStore = bootstrap?.storeSlug === "vendly";
  const isReadOnly = Boolean(isDemoStore && !bootstrap?.canWrite);
  const persistedCollectoPayoutMode = store.collectoPayoutMode || bootstrap?.collectoPayoutMode || "automatic_per_order";
  const isManualPayoutMode = collectoPayoutMode === "manual_batch";
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
      if (!isManualPayoutMode || !storeId) {
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
  }, [isManualPayoutMode, storeId]);

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

  const handleDemoLogin = async () => {
    if (!isReadOnly) return;
    try {
      setIsSigningIn(true);
      await signInWithGoogle({
        callbackURL: pathname,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 pb-24 sm:p-6 lg:p-8">
      <div className="mb-12 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Settings</h1>
        <p className="text-sm text-neutral-500">Manage your store details, policies, payments, and integrations.</p>
      </div>

      {isReadOnly && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-amber-950">Demo Store</p>
                <p className="text-sm text-amber-900/80">
                 This is a demo store. To make changes, sign in with Google.
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={handleDemoLogin} disabled={isSigningIn} className="h-10 rounded-xl px-4 font-semibold">
              {isSigningIn ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <Google />
                  <span className="ml-2">Login for full access</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className={isReadOnly ? "space-y-16 pointer-events-none opacity-70" : "space-y-16"}>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            {success}
          </div>
        ) : null}

        {/* General Section */}
        <section className="space-y-6" data-tour-step-id="store-logo">
          <div className="flex items-center gap-2.5 px-1">
            <HugeiconsIcon icon={Settings02Icon} size={20} className="text-primary" />
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold text-neutral-900">General</h2>
              <p className="text-sm text-neutral-500">Update your store profile and default currency.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden divide-y divide-neutral-100">
            {/* Store Name & Phone */}
            <div className="p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.05em] text-neutral-400">Store Name</label>
                  <div className="text-sm font-medium text-neutral-900">{store.name || "—"}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.05em] text-neutral-400">Phone Number</label>
                  <div className="text-sm font-medium text-neutral-900">{store.storeContactPhone || "—"}</div>
                </div>
              </div>
            </div>

            {/* Store Logo */}
            <div className="p-6">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.05em] text-neutral-400 block">Store Logo</label>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-inner shrink-0 group">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={`${store.name} logo`}
                          fill
                          className="object-cover"
                          unoptimized={logoUrl.includes(".ufs.sh")}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-300">
                          <HugeiconsIcon icon={Image02Icon} size={28} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoInputChange}
                        disabled={!store.tenantId || isLogoBusy}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl font-semibold h-9 px-4 border-neutral-200 hover:bg-neutral-50"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={!store.tenantId || isLogoBusy}
                        >
                          {isLogoBusy ? "Uploading..." : logoUrl ? "Change logo" : "Upload logo"}
                        </Button>
                        {logoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl font-semibold text-xs"
                            onClick={handleRemoveLogo}
                            disabled={isLogoBusy}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Recommended: Square PNG or JPG, at least 400x400px.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Currency */}
            <div className="p-6 overflow-visible">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.05em] text-neutral-400">Store Currency</label>
                  <p className="text-xs text-neutral-500 max-w-sm">The primary currency products are priced in.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Combobox 
                    items={CURRENCY_OPTIONS} 
                    value={CURRENCY_OPTIONS.find(opt => opt.value === currency)}
                    onValueChange={(v) => { if (v) setCurrency(v.value as AllowedCurrency) }}
                  >
                    <ComboboxInput 
                      placeholder="Search currency..." 
                      showClear
                      className="h-10 w-[140px] rounded-xl border-neutral-200 bg-white text-base sm:text-sm"
                    />
                    <ComboboxContent className="rounded-xl border-neutral-200 shadow-xl overflow-hidden">
                      <ComboboxEmpty className="p-3 text-xs text-neutral-400">No currency found.</ComboboxEmpty>
                      <ComboboxList className="p-1">
                        {(opt: { value: string; label: string }) => (
                          <ComboboxItem key={opt.value} value={opt} className="text-sm rounded-lg mx-1 my-0.5">
                            {opt.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <Button 
                    type="button" 
                    onClick={onSave} 
                    disabled={isCurrencyBusy} 
                    className="h-10 rounded-xl px-6 font-bold shadow-sm shadow-primary/20 active:scale-95 transition-transform"
                  >
                    {isSavingCurrency ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Policies Section */}
        <section className="space-y-6" data-tour-step-id="store-policy">
          <div className="flex items-center gap-2.5 px-1">
            <HugeiconsIcon icon={LegalIcon} size={20} className="text-primary" />
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold text-neutral-900">Policies</h2>
              <p className="text-sm text-neutral-500">Manage your store&apos;s legal and customer policies.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.05em] text-neutral-400">Store Policy</label>
              <p className="text-xs text-neutral-500 max-w-2xl">This policy will automatically appear below each product description on your storefront.</p>
            </div>
            <Textarea
              value={storePolicy}
              onChange={(event) => setStorePolicy(event.target.value)}
              placeholder="Add your store policy for returns, exchanges, delivery timelines, etc."
              className="min-h-[240px] resize-y rounded-xl border-neutral-200 bg-neutral-50/50 p-4 focus-visible:ring-primary/20 text-sm leading-relaxed"
              disabled={isPolicyBusy}
            />
            <div className="flex justify-end pt-2">
              <Button 
                type="button" 
                onClick={onSavePolicy} 
                disabled={isPolicyBusy} 
                className="h-10 rounded-xl px-6 font-bold shadow-sm shadow-primary/20 active:scale-95 transition-transform"
              >
                {isSavingPolicy ? "Saving..." : "Save Policy"}
              </Button>
            </div>
          </div>
        </section>

        {/* Payments Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 px-1">
            <HugeiconsIcon icon={Wallet02Icon} size={20} className="text-primary" />
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold text-neutral-900">Payments</h2>
              <p className="text-sm text-neutral-500">Configure your payout preferences and view balances.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden divide-y divide-neutral-100">
            <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.05em] text-neutral-400">Pass transaction fee to customer</label>
                <p className="text-xs text-neutral-500 max-w-lg">When enabled, the customer covers the transaction fee during checkout.</p>
              </div>
              <Switch checked={passTransactionFeeToCustomer} onCheckedChange={(checked) => setPassTransactionFeeToCustomer(Boolean(checked))} />
            </div>

            <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.05em] text-neutral-400">Payout mode</label>
                <p className="text-xs text-neutral-500 max-w-lg">Choose between automatic per-order or manual batch payouts.</p>
              </div>
              <Combobox 
                items={PAYOUT_MODE_OPTIONS} 
                value={PAYOUT_MODE_OPTIONS.find((opt) => opt.value === collectoPayoutMode)}
                onValueChange={(v) => {
                  if (v) setCollectoPayoutMode(v.value as "automatic_per_order" | "manual_batch");
                }}
              >
                <ComboboxInput 
                  placeholder="Search mode..." 
                  className="h-10 w-full sm:w-[220px] rounded-xl border-neutral-200 bg-white text-base sm:text-sm"
                />
                <ComboboxContent className="rounded-xl border-neutral-200 shadow-xl overflow-hidden">
                  <ComboboxEmpty className="p-3 text-xs text-neutral-400">No mode found.</ComboboxEmpty>
                  <ComboboxList className="p-1">
                    {(opt: { value: string; label: string }) => (
                      <ComboboxItem key={opt.value} value={opt} className="text-sm rounded-lg mx-1 my-0.5">
                        {opt.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.05em] text-neutral-400">Current Payout Summary</label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4 transition-colors hover:bg-neutral-50">
                    <p className="text-[9px] uppercase font-bold text-neutral-400 tracking-[0.1em]">Available Balance</p>
                    <p className="mt-1 text-xl font-bold text-neutral-900 leading-none">UGX {(collectoBalance?.availableBalance ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4 transition-colors hover:bg-neutral-50">
                    <p className="text-[9px] uppercase font-bold text-neutral-400 tracking-[0.1em]">Payout After Fee</p>
                    <p className="mt-1 text-xl font-bold text-neutral-900 leading-none">UGX {(collectoBalance?.payoutAmount ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4 transition-colors hover:bg-neutral-50">
                    <p className="text-[9px] uppercase font-bold text-neutral-400 tracking-[0.1em]">Orders Waiting</p>
                    <p className="mt-1 text-xl font-bold text-neutral-900 leading-none">{isCollectoLoading ? "..." : (collectoBalance?.orderCount ?? 0)}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <p className="text-xs text-neutral-400 max-w-sm italic leading-relaxed">
                  {isManualPayoutMode
                    ? (collectoBalance?.availableBalance ?? 0) > 0
                      ? "• Manual payout mode is active. Trigger payout once you are ready to settle available funds."
                      : "• Manual payout mode is active, but there are no settled funds available for payout yet."
                    : collectoPayoutMode !== persistedCollectoPayoutMode
                      ? "• Save your payout preference change to update how payouts are handled."
                      : "• Automatic payout mode is active. Seller payouts are processed automatically, so no manual trigger is shown."}
                </p>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    onClick={onSaveCollecto} 
                    disabled={isSavingCollecto} 
                    className="h-10 rounded-xl px-5 font-bold shadow-sm shadow-primary/20 active:scale-95 transition-transform"
                  >
                    {isSavingCollecto ? "Saving..." : "Save Preferences"}
                  </Button>
                  {isManualPayoutMode && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleManualPayout} 
                      disabled={isCollectoLoading || (collectoBalance?.availableBalance ?? 0) <= 0} 
                      className="h-10 rounded-xl px-5 font-bold border-neutral-200 hover:bg-neutral-50 active:scale-95 transition-transform"
                    >
                      Trigger Payout
                      <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Storefront Section */}
        <section className="space-y-6" data-tour-step-id="store-hero">
          <div className="flex items-center gap-2.5 px-1">
            <HugeiconsIcon icon={Layout01Icon} size={20} className="text-primary" />
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold text-neutral-900">Storefront</h2>
              <p className="text-sm text-neutral-500">Customise your storefront header and hero media.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-6 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.05em] text-neutral-400">Storefront Imagery</label>
              <p className="text-xs text-neutral-500">Upload and manage images for your storefront hero section.</p>
            </div>
            <HeroEditor
              storeSlug={store.slug}
              tenantId={store.tenantId}
              heroMedia={heroMedia}
              onUpdate={setHeroMedia}
              readOnly={isReadOnly}
            />
          </div>
        </section>

        {/* Integrations Section */}
        <section className="space-y-6 pb-12" data-tour-step-id="store-hero">
          <IntegrationsPanel />
        </section>
      </div>
    </div>
  );
}
