"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  Download01Icon,
  InstagramIcon,
  Loading03Icon,
  MusicNote02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";

import { useTenant } from "@/app/admin/context/tenant-context";

type IntegrationsPanelVariant = "default" | "compact";

export function IntegrationsPanel({
  variant = "default",
}: {
  variant?: IntegrationsPanelVariant;
}) {
  const params = useSearchParams();
  const paramConnected = params.get("connected") === "true";
  const tiktokConnectedParam = params.get("tiktokConnected") === "true";

  const { bootstrap, error } = useTenant();
  const storeId = bootstrap?.storeId;

  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isSyncingPosts, setIsSyncingPosts] = React.useState(false);
  const [syncPostsError, setSyncPostsError] = React.useState<string | null>(null);
  const [syncPostsSuccess, setSyncPostsSuccess] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [isConnectedFromApi, setIsConnectedFromApi] = React.useState(false);
  const [isTikTokConnectedFromApi, setIsTikTokConnectedFromApi] =
    React.useState(false);
  const [isTikTokConnecting, setIsTikTokConnecting] = React.useState(false);
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
        if (data.storeLinked) setIsTikTokConnectedFromApi(true);
      })
      .catch((e) => console.error("Failed to check tiktok status", e));
  }, [storeId]);

  const connected = paramConnected || isConnectedFromApi;
  const tiktokConnected = tiktokConnectedParam || isTikTokConnectedFromApi;

  React.useEffect(() => {
    const shouldSync = paramConnected && Boolean(storeId);
    if (!shouldSync) return;

    let cancelled = false;
    const run = async () => {
      try {
        setSyncError(null);
        const res = await fetch("/api/integrations/instagram/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Instagram sync failed");
        }
        if (!cancelled) setIsConnectedFromApi(true);
      } catch (e) {
        if (!cancelled)
          setSyncError(
            e instanceof Error ? e.message : "Instagram sync failed",
          );
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [paramConnected, storeId]);

  React.useEffect(() => {
    const shouldSyncTikTok = tiktokConnectedParam && Boolean(storeId);
    if (!shouldSyncTikTok) return;

    let cancelled = false;
    const run = async () => {
      try {
        setTiktokSyncError(null);
        const res = await fetch("/api/integrations/tiktok/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "TikTok sync failed");
        }
        if (!cancelled) setIsTikTokConnectedFromApi(true);
      } catch (e) {
        if (!cancelled)
          setTiktokSyncError(
            e instanceof Error ? e.message : "TikTok sync failed",
          );
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [tiktokConnectedParam, storeId]);

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

  const handleTikTokConnect = async () => {
    if (!bootstrap?.storeSlug) return;
    setIsTikTokConnecting(true);
    try {
      const authModule = await import("@shopvendly/auth/client");
      const maybeLinkTikTok = (
        authModule as {
          linkTikTok?: (options?: {
            callbackURL?: string;
            scopes?: string[];
          }) => Promise<unknown>;
        }
      ).linkTikTok;

      if (maybeLinkTikTok) {
        await maybeLinkTikTok({
          callbackURL: `/admin/${bootstrap.storeSlug}?tiktokConnected=true`,
          scopes: ["user.info.basic", "user.info.profile", "video.list"],
        });
      } else {
        await (
          authModule as {
            authClient: {
              linkSocial: (options: {
                provider: "tiktok";
                callbackURL: string;
                scopes: string[];
              }) => Promise<unknown>;
            };
          }
        ).authClient.linkSocial({
          provider: "tiktok",
          callbackURL: `/admin/${bootstrap.storeSlug}?tiktokConnected=true`,
          scopes: ["user.info.basic", "user.info.profile", "video.list"],
        });
      }
    } finally {
      setIsTikTokConnecting(false);
    }
  };

  const handleSyncPosts = async () => {
    if (!bootstrap?.storeId) return;
    setIsSyncingPosts(true);
    setSyncPostsError(null);
    setSyncPostsSuccess(false);
    try {
      const res = await fetch("/api/integrations/instagram/sync-posts", {
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
        <div className="rounded-xl border border-border/70 overflow-hidden shadow-sm">
          <div className="bg-linear-to-r from-purple-600 via-pink-500 to-orange-400 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="mr-3 h-10 w-10 rounded-full bg-pink-100 p-2 text-pink-500">
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  className="h-3.5 w-3.5"
                />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white/80">
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
                    : "Link your Instagram to start importing products from posts."}
                </p>
              </div>
              <Button
                onClick={handleConnect}
                disabled={isConnecting || !bootstrap?.storeSlug}
                variant={connected ? "outline" : "default"}
                size="sm"
                className="shrink-0"
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
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      className="mr-2 h-3.5 w-3.5"
                    />
                    Connect
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
                      ? "Sync complete. New posts still sync automatically via webhooks."
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
                      Synced
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

        <div className="rounded-xl border border-border/70 overflow-hidden shadow-sm">
          <div className="bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-700 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <HugeiconsIcon
                  icon={MusicNote02Icon}
                  className="h-5 w-5 text-white"
                />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">TikTok</p>
                <p className="text-xs text-white/70">
                  Show your TikTok inspiration feed on storefront
                </p>
              </div>
            </div>

            {tiktokConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  className="h-3.5 w-3.5"
                />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white/80">
                Not connected
              </span>
            )}
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

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {tiktokConnected ? "Account linked" : "Connect your account"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tiktokConnected
                    ? "Your TikTok account is linked to this store's Inspiration tab."
                    : "Link TikTok to enable the Inspiration feed on your storefront."}
                </p>
              </div>
              <Button
                onClick={handleTikTokConnect}
                disabled={isTikTokConnecting || !bootstrap?.storeSlug}
                variant={tiktokConnected ? "outline" : "default"}
                size="sm"
                className="shrink-0"
              >
                {isTikTokConnecting ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="mr-2 h-3.5 w-3.5 animate-spin"
                    />
                    Connecting…
                  </>
                ) : tiktokConnected ? (
                  "Reconnect"
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={MusicNote02Icon}
                      className="mr-2 h-3.5 w-3.5"
                    />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
