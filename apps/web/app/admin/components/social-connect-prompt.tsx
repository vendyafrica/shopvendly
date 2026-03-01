"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InstagramIcon, MusicNote02Icon, Loading03Icon, Share01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@shopvendly/ui/lib/utils";
import { useTenant } from "@/app/admin/context/tenant-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shopvendly/ui/components/dialog";

function useIntegrationStatus(storeId?: string) {
  const [igConnected, setIgConnected] = React.useState<boolean | null>(null);
  const [ttConnected, setTtConnected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    const run = async () => {
      try {
        const [igRes, ttRes] = await Promise.all([
          fetch(`/api/integrations/instagram/status?storeId=${storeId}`),
          fetch(`/api/integrations/tiktok/status?storeId=${storeId}`),
        ]);
        if (!cancelled) {
          const ig = await igRes.json();
          const tt = await ttRes.json();
          setIgConnected(Boolean(ig?.connected));
          setTtConnected(Boolean(tt?.storeLinked));
        }
      } catch (e) {
        console.error("Failed to fetch integration status", e);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return { igConnected, ttConnected };
}

export function SocialConnectPrompt({ className }: { className?: string }) {
  const { bootstrap } = useTenant();
  const storeId = bootstrap?.storeId;
  const storeSlug = bootstrap?.storeSlug;
  const { igConnected, ttConnected } = useIntegrationStatus(storeId);
  const [linking, setLinking] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const connectInstagram = async () => {
    if (!storeSlug) return;
    setLinking("instagram");
    try {
      const { linkInstagram } = await import("@shopvendly/auth/client");
      await linkInstagram({ callbackURL: `/admin/${storeSlug}?connected=true` });
    } finally {
      setLinking(null);
    }
  };

  const connectTikTok = async () => {
    if (!storeSlug) return;
    setLinking("tiktok");
    try {
      const authModule = await import("@shopvendly/auth/client");
      const maybeLinkTikTok = (authModule as { linkTikTok?: (options?: { callbackURL?: string; scopes?: string[] }) => Promise<unknown> }).linkTikTok;
      if (maybeLinkTikTok) {
        await maybeLinkTikTok({
          callbackURL: `/admin/${storeSlug}?tiktokConnected=true`,
          scopes: ["user.info.basic", "user.info.profile", "video.list"],
        });
      } else {
        await (authModule as {
          authClient: {
            linkSocial: (options: { provider: "tiktok"; callbackURL: string; scopes: string[] }) => Promise<unknown>;
          };
        }).authClient.linkSocial({
          provider: "tiktok",
          callbackURL: `/admin/${storeSlug}?tiktokConnected=true`,
          scopes: ["user.info.basic", "user.info.profile", "video.list"],
        });
      }
    } finally {
      setLinking(null);
    }
  };

  const shouldRenderInstagram = igConnected === false || igConnected === null;
  const shouldRenderTikTok = ttConnected === false || ttConnected === null;

  if (!storeId) return null;
  if (!shouldRenderInstagram && !shouldRenderTikTok) return null;

  return (
    <div className={cn(className)}>
      <button
        type="button"
        className="flex h-14 w-full items-center gap-3 rounded-xl border bg-card/80 px-4 py-3 text-left shadow-sm transition hover:bg-muted/60"
        onClick={() => setModalOpen(true)}
      >
        <HugeiconsIcon icon={Share01Icon} className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Connect</p>
      </button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[92vw] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Connect socials</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {shouldRenderInstagram && (
              <button
                type="button"
                onClick={connectInstagram}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border bg-card/80 px-4 py-3 text-left hover:bg-muted/40",
                  linking === "instagram" && "opacity-70"
                )}
                disabled={linking === "instagram"}
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <HugeiconsIcon icon={InstagramIcon} className="size-4" />
                </div>
                <span className="text-sm font-semibold">Instagram</span>
                {linking === "instagram" && <HugeiconsIcon icon={Loading03Icon} className="ml-auto size-4 animate-spin text-muted-foreground" />}
              </button>
            )}

            {shouldRenderTikTok && (
              <button
                type="button"
                onClick={connectTikTok}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border bg-card/80 px-4 py-3 text-left hover:bg-muted/40",
                  linking === "tiktok" && "opacity-70"
                )}
                disabled={linking === "tiktok"}
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <HugeiconsIcon icon={MusicNote02Icon} className="size-4" />
                </div>
                <span className="text-sm font-semibold">TikTok</span>
                {linking === "tiktok" && <HugeiconsIcon icon={Loading03Icon} className="ml-auto size-4 animate-spin text-muted-foreground" />}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
