"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon, Share01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@shopvendly/ui/lib/utils";
import { StoreAvatar } from "@/components/store-avatar";

interface MobileStoreHeaderProps {
  storeName: string;
  storeDescription?: string | null;
  storefrontUrl: string;
  logoUrl?: string | null;
  heroMedia?: string[];
}

export function MobileStoreHeader({
  storeName,
  storeDescription,
  storefrontUrl,
  logoUrl,
  heroMedia,
}: MobileStoreHeaderProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        const shareNavigator = window.navigator as Navigator & {
          share?: (data: ShareData) => Promise<void>;
        };

        if (typeof shareNavigator.share === "function") {
          await shareNavigator.share({
            title: storeName,
            url: storefrontUrl,
          });
          return;
        }

        const clipboardNavigator = window.navigator as Navigator & {
          clipboard?: Clipboard;
        };

        if (clipboardNavigator.clipboard) {
          await clipboardNavigator.clipboard.writeText(storefrontUrl);
          setIsCopied(true);
          window.setTimeout(() => setIsCopied(false), 1800);
          return;
        }
      }

      throw new Error("Share and clipboard APIs are unavailable.");
    } catch (error) {
      console.error("Failed to share store link:", error);
    }
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card/95 p-4 shadow-sm shadow-black/5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <StoreAvatar storeName={storeName} logoUrl={logoUrl || (heroMedia?.[0] ?? null)} size="lg" className="shrink-0 ring-1 ring-border/60" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[1.05rem] font-semibold tracking-tight text-foreground">
            {storeName}
          </p>
          {storeDescription ? (
            <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
              {storeDescription}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <a
          href={storefrontUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-2.5",
            "text-sm font-medium text-foreground transition-all duration-200 active:scale-[0.98]",
            "shadow-sm shadow-black/5 hover:border-primary/20 hover:bg-primary/5"
          )}
        >
          <HugeiconsIcon icon={Link01Icon} size={18} className="text-muted-foreground" />
          <span>Visit store</span>
        </a>

        <button
          type="button"
          onClick={handleShare}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-2.5",
            "text-sm font-medium text-foreground transition-all duration-200 active:scale-[0.98]",
            "shadow-sm shadow-black/5 hover:border-primary/20 hover:bg-primary/5",
            isCopied && "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
          )}
        >
          <HugeiconsIcon
            icon={Share01Icon}
            size={18}
            className={cn(isCopied ? "text-emerald-600" : "text-muted-foreground")}
          />
          <span>{isCopied ? "Copied" : "Share link"}</span>
        </button>
      </div>
    </div>
  );
}
