"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  Download01Icon,
  InstagramIcon,
  Loading03Icon,
  PlugIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";

import { useTenant } from "@/modules/admin/context/tenant-context";

type IntegrationsPanelVariant = "default" | "compact";

export function IntegrationsPanel({
  variant = "default",
}: {
  variant?: IntegrationsPanelVariant;
}) {
  const params = useSearchParams();
  const paramConnected = params.get("connected") === "true";
  const router = useRouter();
  const pathname = usePathname();

  const { bootstrap, error } = useTenant();
  const storeId = bootstrap?.storeId;
  const isVendlyDemoStore = bootstrap?.storeSlug === "vendly";

  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isSyncingPosts, setIsSyncingPosts] = React.useState(false);
  const [syncPostsError, setSyncPostsError] = React.useState<string | null>(null);
  const [syncPostsSuccess, setSyncPostsSuccess] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [isConnectedFromApi, setIsConnectedFromApi] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = React.useState(false);
  const [showDangerZone, setShowDangerZone] = React.useState(false);

  React.useEffect(() => {
    if (!storeId) return;
    fetch(`/api/integrations/instagram/status?storeId=${storeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) setIsConnectedFromApi(true);
        if (data.imported) setSyncPostsSuccess(true);
      })
      .catch((e) => console.error("Failed to check instagram status", e));
  }, [storeId]);

  const connected = isConnectedFromApi;

  React.useEffect(() => {
    const shouldSync = paramConnected && Boolean(storeId);
    if (!shouldSync) return;

    let cancelled = false;
    const run = async () => {
      try {
        setSyncError(null);
        setSyncPostsError(null);
        const res = await fetch("/api/integrations/instagram/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Instagram sync failed");
        }

        const statusRes = await fetch(`/api/integrations/instagram/status?storeId=${storeId}`);
        const statusJson = await statusRes.json().catch(() => ({} as { imported?: boolean }));
        const alreadyImported = Boolean(statusJson?.imported);

        if (!alreadyImported) {
          const importRes = await fetch("/api/integrations/instagram/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storeId }),
          });

          if (!importRes.ok) {
            const importText = await importRes.text();
            throw new Error(importText || "Instagram auto-import failed");
          }
        }

        if (!cancelled) {
          setIsConnectedFromApi(true);
          setSyncPostsSuccess(true);
        }
      } catch (e) {
        if (!cancelled) {
          setSyncError(
            e instanceof Error ? e.message : "Instagram sync failed",
          );
          setSyncPostsError(
            e instanceof Error ? e.message : "Instagram auto-import failed",
          );
        }
      }
    };

    void run();
    const nextParams = new URLSearchParams(params.toString());
    nextParams.delete("connected");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    return () => {
      cancelled = true;
    };
  }, [paramConnected, storeId, params, pathname, router]);

  const handleConnect = async () => {
    if (!bootstrap?.storeSlug || isVendlyDemoStore) return;
    setIsConnecting(true);
    try {
      const { linkInstagram } = await import("@shopvendly/auth/client");
      await linkInstagram({
        callbackURL: `/admin/${bootstrap.storeSlug}?connected=true`,
      });
    } finally {
      setIsConnecting(false);
    }
  };



  const handleSyncPosts = async () => {
    if (!bootstrap?.storeId) return;
    setIsSyncingPosts(true);
    setSyncPostsError(null);
    setSyncPostsSuccess(false);
    try {
      const res = await fetch("/api/integrations/instagram/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: bootstrap.storeId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Sync posts failed");
      }
      setSyncPostsSuccess(true);
    } catch (e) {
      setSyncPostsError(e instanceof Error ? e.message : "Sync posts failed");
    } finally {
      setIsSyncingPosts(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(false);
    try {
      const res = await fetch("/api/integrations/instagram", {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete Instagram data");
      }
      setIsConnectedFromApi(false);
      setDeleteSuccess(true);
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Failed to delete Instagram data",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const isCompact = variant === "compact";

  return (
    <div className={isCompact ? "flex h-full flex-col space-y-4" : "space-y-6"}>
      {!isCompact && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={PlugIcon} size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-neutral-900">Integrations</h2>
          </div>
          <p className="text-sm text-neutral-500">
            Connect your tools to keep Vendly in sync.
          </p>
        </div>
      )}

      {isVendlyDemoStore && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <HugeiconsIcon icon={AlertCircleIcon} className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div className="space-y-1">
              <p className="font-semibold">Demo store limitation</p>
              <p className="text-amber-800/90">
                Instagram and social account linking require a real logged-in account.
                This a demo store only.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className={isCompact ? "grid gap-6" : "grid gap-6"}>
        <div className="rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-neutral-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-500 border border-pink-100">
                <HugeiconsIcon icon={InstagramIcon} className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-neutral-900 text-base">Instagram</p>
                <p className="text-sm text-neutral-500">
                  Import posts as products automatically
                </p>
              </div>
            </div>

            {connected ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-emerald-100/50 self-start sm:self-auto">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  className="h-3.5 w-3.5"
                />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 text-neutral-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-neutral-200/50 self-start sm:self-auto">
                Not connected
              </span>
            )}
          </div>

          <div className="flex flex-col gap-6 p-5">
            {syncError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-700">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  className="h-4 w-4 shrink-0"
                />
                {syncError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="max-w-md">
                <p className="text-sm font-semibold text-neutral-900">
                  {connected ? "Account linked" : "Connect your account"}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {connected
                    ? "Your Instagram account is connected and syncing."
                    : "Link your Instagram to import products from posts."}
                </p>
              </div>
              <Button
                onClick={handleConnect}
                disabled={isConnecting || !bootstrap?.storeSlug || isVendlyDemoStore}
                variant={connected ? "outline" : "default"}
                className="h-10 rounded-xl px-5 font-semibold shrink-0"
              >
                {isConnecting ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                    Connecting…
                  </>
                ) : connected ? (
                  "Reconnect"
                ) : (
                  isVendlyDemoStore ? "Demo only" : "Connect Instagram"
                )}
              </Button>
            </div>

            {connected && (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="max-w-md">
                  <p className="text-sm font-semibold text-neutral-900">
                    {syncPostsSuccess ? "Posts synced" : "Sync posts"}
                  </p>
                  <p className="text-[13px] text-neutral-500 mt-1 leading-relaxed">
                    {syncPostsSuccess
                      ? "Sync complete. Imported Instagram posts are saved as Draft. Publish them in Products to show on storefront."
                      : "Fallback manual sync for posts if webhook delivery misses updates."}
                  </p>
                </div>
                <Button
                  onClick={handleSyncPosts}
                  disabled={isSyncingPosts || !bootstrap?.storeId}
                  variant="outline"
                  className="h-10 rounded-xl px-5 font-semibold shrink-0 bg-white"
                >
                  {isSyncingPosts ? (
                    <>
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                      Syncing…
                    </>
                  ) : syncPostsSuccess ? (
                    <>
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        className="mr-2 h-5 w-5 text-emerald-500"
                      />
                      Drafts Imported
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon
                        icon={Download01Icon}
                        className="mr-2 h-4 w-4"
                      />
                      Sync Posts
                    </>
                  )}
                </Button>
              </div>
            )}

            {connected && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800 leading-relaxed">
                Instagram imports are saved as <span className="font-semibold">Draft</span> by default.
                Publish them from <span className="font-semibold">Products</span> before they appear on your storefront.
              </div>
            )}

            {syncPostsError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-700">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  className="h-4 w-4 shrink-0"
                />
                {syncPostsError}
              </div>
            )}
          </div>

          {connected && (
            <div className="border-t border-neutral-100 bg-neutral-50/50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowDangerZone((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <span className="uppercase tracking-wider">
                  Danger Zone
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className={`h-4 w-4 transition-transform ${showDangerZone ? "rotate-180" : ""}`}
                />
              </button>

              {showDangerZone && (
                <div className="px-5 pb-5 pt-1 space-y-4">
                  <p className="text-[13px] text-neutral-500 leading-relaxed max-w-md">
                    Disconnects your Instagram account and removes Instagram
                    products, media, jobs, and stored tokens.
                  </p>
                  <Button
                    variant="destructive"
                    className="h-10 rounded-xl px-5 font-semibold text-sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <HugeiconsIcon
                          icon={Loading03Icon}
                          className="mr-2 h-4 w-4 animate-spin"
                        />
                        Disconnecting…
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          className="mr-2 h-4 w-4"
                        />
                        Disconnect & Delete Data
                      </>
                    )}
                  </Button>
                  {deleteError && (
                    <p className="text-[13px] font-medium text-red-600">{deleteError}</p>
                  )}
                  {deleteSuccess && (
                    <p className="text-[13px] font-medium text-emerald-600">
                      Instagram connection removed successfully.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
