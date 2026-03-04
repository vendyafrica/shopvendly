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
  TiktokIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";

import { useTenant } from "@/app/admin/context/tenant-context";

type IntegrationsPanelVariant = "default" | "compact";
const TIKTOK_IMPORT_TARGET = 25;

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

  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isSyncingPosts, setIsSyncingPosts] = React.useState(false);
  const [syncPostsError, setSyncPostsError] = React.useState<string | null>(null);
  const [syncPostsSuccess, setSyncPostsSuccess] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [isConnectedFromApi, setIsConnectedFromApi] = React.useState(false);
  const [isTikTokImporting, setIsTikTokImporting] = React.useState(false);
  const [tiktokProfileInput, setTikTokProfileInput] = React.useState("");
  const [tiktokImportedCount, setTikTokImportedCount] = React.useState(0);
  const [tiktokTargetCount, setTikTokTargetCount] = React.useState(TIKTOK_IMPORT_TARGET);
  const [tiktokSyncSuccess, setTikTokSyncSuccess] = React.useState(false);
  const [tiktokSyncError, setTiktokSyncError] = React.useState<string | null>(
    null,
  );
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

    fetch(`/api/integrations/tiktok/status?storeId=${storeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profileUrl) setTikTokProfileInput(data.profileUrl);
        if (typeof data.importedCount === "number") setTikTokImportedCount(data.importedCount);
      })
      .catch((e) => console.error("Failed to check tiktok status", e));
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
    if (!bootstrap?.storeSlug) return;
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

  const handleTikTokImport = async () => {
    if (!bootstrap?.storeId) return;

    const profileUrl = tiktokProfileInput.trim();
    if (!profileUrl) {
      setTiktokSyncError("TikTok profile URL or handle is required.");
      return;
    }

    setIsTikTokImporting(true);
    setTiktokSyncError(null);
    setTikTokSyncSuccess(false);
    setTikTokImportedCount(0);
    setTikTokTargetCount(TIKTOK_IMPORT_TARGET);

    const checkJobStatus = async (jobId: string) => {
      const MAX_RETRIES = 60; // 120 seconds roughly
      for (let i = 0; i < MAX_RETRIES; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
          const res = await fetch(`/api/integrations/tiktok/sync?jobId=${jobId}`);
          if (!res.ok) continue;

          const job = await res.json() as {
            status: "running" | "completed" | "failed";
            targetCount?: number;
            importedCount?: number;
            error?: string;
            profileUrl?: string;
            lastImportedAt?: string;
          };

          if (typeof job.importedCount === "number") {
            setTikTokImportedCount(job.importedCount);
          }
          if (typeof job.targetCount === "number" && job.targetCount > 0) {
            setTikTokTargetCount(job.targetCount);
          }

          if (job.status === "completed") {
            setTikTokProfileInput(job.profileUrl || profileUrl);
            setTikTokSyncSuccess(true);
            return;
          }

          if (job.status === "failed") {
            throw new Error(job.error || "TikTok import failed");
          }
        } catch (e) {
          if (e instanceof Error && e.message !== "TikTok import failed") {
            continue;
          }
          throw e;
        }
      }
      throw new Error("TikTok import timed out");
    };

    try {
      const res = await fetch("/api/integrations/tiktok/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: bootstrap.storeId,
          profileUrl,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        jobId?: string;
      };

      if (!res.ok || !data.jobId) {
        throw new Error(data.error || "Failed to start TikTok import");
      }

      await checkJobStatus(data.jobId);
    } catch (e) {
      setTiktokSyncError(e instanceof Error ? e.message : "TikTok import failed");
    } finally {
      setIsTikTokImporting(false);
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
  const tiktokProgressPercent = Math.min(
    100,
    Math.round(
      (tiktokImportedCount / Math.max(tiktokTargetCount, 1)) * 100,
    ),
  );

  return (
    <div className={isCompact ? "flex h-full flex-col space-y-4" : "space-y-6"}>
      {!isCompact && (
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect your tools to keep Vendly in sync.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className={isCompact ? "grid gap-6" : "grid gap-6 lg:grid-cols-2"}>
        <div className="rounded-md border border-border/70 overflow-hidden shadow-sm">
          <div className="px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="mr-3 h-10 w-10 rounded-md p-2 text-pink-500">
                <HugeiconsIcon icon={InstagramIcon} className="h-full w-full" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Instagram</p>
                <p className="text-xs text-white/70">
                  Import posts as products automatically
                </p>
              </div>
            </div>

            {connected ? (
              <span className="gap-2 rounded-md px-2 py-1 text-xs font-semibold">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  className="h-3.5 w-3.5"
                />
                Connected
              </span>
            ) : (
              <span className="gap-2 rounded-md px-2 py-1 text-xs font-semibold">
                Not connected
              </span>
            )}
          </div>

          <div className="p-6 space-y-5 bg-card">
            {syncError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  className="h-4 w-4 shrink-0"
                />
                {syncError}
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {connected ? "Account linked" : "Connect your account"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {connected
                    ? "Your Instagram account is connected and syncing."
                    : "Link your Instagram to import products from posts."}
                </p>
              </div>
              <Button
                onClick={handleConnect}
                disabled={isConnecting || !bootstrap?.storeSlug}
                variant={connected ? "default" : "outline"}
                size="sm"
                className="shrink-0 rounded-md"
              >
                {isConnecting ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="mr-2 h-3.5 w-3.5 animate-spin"
                    />
                    Connecting…
                  </>
                ) : connected ? (
                  "Reconnect"
                ) : (
                  <>
                    Connect Instagram
                  </>
                )}
              </Button>
            </div>

            {connected && (
              <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {syncPostsSuccess ? "Posts synced" : "Sync posts"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {syncPostsSuccess
                      ? "Sync complete. Imported Instagram posts are saved as Draft. Publish them in Products to show on storefront."
                      : "Fallback manual sync for posts if webhook delivery misses updates."}
                  </p>
                </div>
                <Button
                  onClick={handleSyncPosts}
                  disabled={isSyncingPosts || !bootstrap?.storeId}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {isSyncingPosts ? (
                    <>
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        className="mr-2 h-3.5 w-3.5 animate-spin"
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
                        className="h-4 w-4"
                      />
                      Sync Posts
                    </>
                  )}
                </Button>
              </div>
            )}

            {connected && (
              <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                Instagram imports are saved as <span className="font-semibold">Draft</span> by default.
                Publish them from <span className="font-semibold">Products</span> before they appear on your storefront.
              </div>
            )}

            {syncPostsError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  className="h-4 w-4 shrink-0"
                />
                {syncPostsError}
              </div>
            )}
          </div>

          {connected && (
            <div className="border-t border-border/50 bg-muted/10">
              <button
                type="button"
                onClick={() => setShowDangerZone((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-medium uppercase tracking-wider">
                  Danger Zone
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className={`h-4 w-4 transition-transform ${showDangerZone ? "rotate-180" : ""}`}
                />
              </button>

              {showDangerZone && (
                <div className="px-6 pb-5 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Disconnects your Instagram account and removes Instagram
                    products, media, jobs, and stored tokens.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <HugeiconsIcon
                          icon={Loading03Icon}
                          className="mr-2 h-3.5 w-3.5 animate-spin"
                        />
                        Disconnecting…
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          className="mr-2 h-3.5 w-3.5"
                        />
                        Disconnect & delete data
                      </>
                    )}
                  </Button>
                  {deleteError && (
                    <p className="text-xs text-destructive">{deleteError}</p>
                  )}
                  {deleteSuccess && (
                    <p className="text-xs text-emerald-600">
                      Instagram connection removed successfully.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative rounded-md border border-border/70 overflow-hidden shadow-sm">
          {isTikTokImporting && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-sm p-6">
              <div className="w-full max-w-sm rounded-md border border-border/60 bg-card p-5 shadow-lg">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="h-4 w-4 animate-spin text-primary"
                  />
                  Importing TikTok posts
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Imported {Math.min(tiktokImportedCount, tiktokTargetCount)} of {tiktokTargetCount} posts
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${tiktokProgressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{tiktokProgressPercent}% complete</p>
              </div>
            </div>
          )}
          <div className="px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <HugeiconsIcon
                  icon={TiktokIcon}
                  className="h-5 w-5 text-black"
                />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">TikTok</p>
                <p className="text-xs text-white/70">
                  Show your TikTok inspiration feed on storefront
                </p>
              </div>
            </div>


          </div>

          <div className="p-6 space-y-5 bg-card">
            {tiktokSyncError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  className="h-4 w-4 shrink-0"
                />
                {tiktokSyncError}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="w-full space-y-3">
                <p className="text-sm font-medium">
                  Import TikTok Inspiration
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paste your TikTok profile URL or @handle to download and append the last 25 videos to your storefront Inspiration tab.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    value={tiktokProfileInput}
                    onChange={(event) => setTikTokProfileInput(event.target.value)}
                    placeholder="Paste your profile link"
                    className="sm:flex-1 rounded-md"
                  />
                  <Button
                    onClick={handleTikTokImport}
                    disabled={isTikTokImporting || !bootstrap?.storeId}
                    variant="default"
                    size="sm"
                    className="shrink-0 rounded-md"
                  >
                    {isTikTokImporting ? (
                      <>
                        <HugeiconsIcon
                          icon={Loading03Icon}
                          className="mr-2 h-3.5 w-3.5 animate-spin"
                        />
                        Importing…
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon
                          icon={Download01Icon}
                          className="mr-2 h-3.5 w-3.5"
                        />
                        Import 25 Posts
                      </>
                    )}
                  </Button>
                </div>

                {(tiktokSyncSuccess) && (
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-emerald-600">
                    Successfully imported {tiktokImportedCount} videos to your storefront.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
