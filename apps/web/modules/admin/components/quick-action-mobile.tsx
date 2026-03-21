"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@shopvendly/ui/lib/utils";

interface QuickActionMobileProps {
  label: string;
  href: string;
  icon: any;
  external?: boolean;
  iconClassName?: string;
}

export function QuickActionMobile({
  label,
  href,
  icon,
  external,
  iconClassName,
}: QuickActionMobileProps) {
  const content = (
    <div className="flex flex-col items-center gap-2 group">
      <div
        className="flex size-14 items-center justify-center transition-all duration-200 group-active:scale-95"
      >
        <HugeiconsIcon icon={icon} size={28} className={cn("text-primary", iconClassName)} />
      </div>
      <span className="text-[11px] font-medium text-muted-foreground group-active:text-foreground transition-colors">
        {label}
      </span>
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="shrink-0">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="shrink-0">
      {content}
    </Link>
  );
}
