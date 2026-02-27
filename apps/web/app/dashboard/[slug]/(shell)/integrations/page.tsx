"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTenant } from "@/features/dashboard/context/tenant-context";
import { Button } from "@shopvendly/ui/components/button";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Instagram, CheckCircle2, AlertCircle, Download, Trash2, ChevronDown, Music2 } from "lucide-react";

export default function IntegrationsPage() {
  const params = useSearchParams();
  const paramConnected = params.get("connected") === "true";
  const tiktokConnectedParam = params.get("tiktokConnected") === "true";

  const { bootstrap, error } = useTenant();
  const storeId = bootstrap?.storeId;

  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importSuccess, setImportSuccess] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [isConnectedFromApi, setIsConnectedFromApi] = React.useState(false);
  const [isTikTokConnectedFromApi, setIsTikTokConnectedFromApi] = React.useState(false);
  const [isTikTokConnecting, setIsTikTokConnecting] = React.useState(false);
  const [tiktokSyncError, setTiktokSyncError] = React.useState<string | null>(null);
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
        if (data.imported) setImportSuccess(true);
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
        if (!cancelled) setSyncError(e instanceof Error ? e.message : "Instagram sync failed");
      }
    };

    void run();
    return () => { cancelled = true; };
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
        if (!cancelled) setTiktokSyncError(e instanceof Error ? e.message : "TikTok sync failed");
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
        callbackURL: `/a/${bootstrap.storeSlug}/integrations?connected=true`,
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
          linkTikTok?: (options?: { callbackURL?: string; scopes?: string[] }) => Promise<unknown>;
        }
      ).linkTikTok;

      if (maybeLinkTikTok) {
        await maybeLinkTikTok({
          callbackURL: `/a/${bootstrap.storeSlug}/integrations?tiktokConnected=true`,
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
          callbackURL: `/a/${bootstrap.storeSlug}/integrations?tiktokConnected=true`,
          scopes: ["user.info.basic", "user.info.profile", "video.list"],
        });
      }
    } finally {
      setIsTikTokConnecting(false);
    }
  };

  const handleImport = async () => {
    if (!bootstrap?.storeId) return;
    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);
    try {
      const res = await fetch("/api/integrations/instagram/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: bootstrap.storeId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Import failed");
      }
      setImportSuccess(true);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(false);
    try {
      const res = await fetch("/api/integrations/instagram", { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete Instagram data");
      }
      setIsConnectedFromApi(false);
      setDeleteSuccess(true);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete Instagram data");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect your tools to keep Vendly in sync.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Instagram Card */}
      <div className="rounded-xl border border-border/70 overflow-hidden shadow-sm">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Instagram</p>
              <p className="text-xs text-white/70">Import posts as products automatically</p>
            </div>
          </div>

          {/* Status badge */}
          {connected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white/80">
              Not connected
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5 bg-card">
          {syncError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {syncError}
            </div>
          )}

          {/* Connect Row */}
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
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Connecting…
                </>
              ) : connected ? (
                "Reconnect"
              ) : (
                <>
                  <Instagram className="mr-2 h-3.5 w-3.5" />
                  Connect
                </>
              )}
            </Button>
          </div>

          {/* Import Row — only shown when connected */}
          {connected && (
            <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {importSuccess ? "Products imported" : "Import products"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {importSuccess
                    ? "Import complete. New posts will sync automatically via webhooks."
                    : "Pull your existing Instagram posts in as products."}
                </p>
              </div>
              <Button
                onClick={handleImport}
                disabled={isImporting || importSuccess || !bootstrap?.storeId}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {isImporting ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Importing…
                  </>
                ) : importSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                    Imported
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Import now
                  </>
                )}
              </Button>
            </div>
          )}

          {importError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {importError}
            </div>
          )}
        </div>

        {/* Danger Zone — collapsible */}
        {connected && (
          <div className="border-t border-border/50 bg-muted/10">
            <button
              type="button"
              onClick={() => setShowDangerZone((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="font-medium uppercase tracking-wider">Danger Zone</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showDangerZone ? "rotate-180" : ""}`}
              />
            </button>

            {showDangerZone && (
              <div className="px-6 pb-5 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Disconnects your Instagram account and removes all stored tokens.{" "}
                  <strong>Imported products are not deleted.</strong>
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Disconnecting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Disconnect &amp; delete data
                    </>
                  )}
                </Button>
                {deleteError && (
                  <p className="text-xs text-destructive">{deleteError}</p>
                )}
                {deleteSuccess && (
                  <p className="text-xs text-emerald-600">Instagram connection removed successfully.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TikTok Card */}
      <div className="rounded-xl border border-border/70 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Music2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">TikTok</p>
              <p className="text-xs text-white/70">Show your TikTok inspiration feed on storefront</p>
            </div>
          </div>

          {tiktokConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
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
              <AlertCircle className="h-4 w-4 shrink-0" />
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
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Connecting…
                </>
              ) : tiktokConnected ? (
                "Reconnect"
              ) : (
                <>
                  <Music2 className="mr-2 h-3.5 w-3.5" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
