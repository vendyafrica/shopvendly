"use client";

import * as React from "react";
import { cn } from "@shopvendly/ui/lib/utils";

interface ShareLinkSectionProps {
  url: string;
}

export function ShareLinkSection({ url }: ShareLinkSectionProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="px-1 py-1 group">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 mb-0.5">
            Your Store Link
          </p>
          <p className="text-sm font-medium text-foreground/70 truncate select-all">
            {url.replace(/^https?:\/\//, "")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "h-8 px-4 rounded-full font-bold text-[11px] transition-all duration-300 active:scale-90 shadow-sm whitespace-nowrap",
            copied
              ? "bg-emerald-500 text-white border-none"
              : "text-primary hover:bg-primary/5 border border-primary/10"
          )}
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}
