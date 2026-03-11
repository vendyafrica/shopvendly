"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InstagramIcon, Loading03Icon, Share01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@shopvendly/ui/lib/utils";
import { useTenant } from "@/app/admin/context/tenant-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shopvendly/ui/components/dialog";

function useIntegrationStatus(storeId?: string) {
  const [igConnected, setIgConnected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    const run = async () => {
      try {
        const igRes = await fetch(`/api/integrations/instagram/status?storeId=${storeId}`);
        if (!cancelled) {
          const ig = await igRes.json();
          setIgConnected(Boolean(ig?.connected));
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

  return { igConnected };
}

export function SocialConnectPrompt({ className, variant = "default" }: { className?: string; variant?: "default" | "compact" }) {
  const { bootstrap } = useTenant();
  const storeId = bootstrap?.storeId;
  const storeSlug = bootstrap?.storeSlug;
  const { igConnected } = useIntegrationStatus(storeId);
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

  const shouldRenderInstagram = igConnected === false || igConnected === null;

  if (!storeId) return null;
  if (!shouldRenderInstagram) return null;

  return (
    <div className={cn(className)}>
      {variant === "compact" ? (
        <button
          type="button"
          className={cn("inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 gap-2", className)}
          onClick={() => setModalOpen(true)}
        >
          <HugeiconsIcon icon={Share01Icon} className="h-4 w-4" />
          Connect
        </button>
      ) : (
        <button
          type="button"
          className={cn("flex h-14 w-full items-center gap-3 rounded-xl border bg-card/80 px-4 py-3 text-left shadow-sm transition hover:bg-muted/60", className)}
          onClick={() => setModalOpen(true)}
        >
          <HugeiconsIcon icon={Share01Icon} className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Connect</p>
        </button>
      )}

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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
