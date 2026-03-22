"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Add01Icon, 
  Invoice01Icon, 
  ShoppingBag01Icon, 
  Share01Icon,
  Link01Icon,
  Settings02Icon
} from "@hugeicons/core-free-icons";
import { cn } from "@shopvendly/ui/lib/utils";

interface QuickAction {
  label: string;
  href: string;
  icon: any;
  external?: boolean;
  color: string;
}

export function QuickActionsGrid({ basePath, storefrontUrl }: { basePath: string, storefrontUrl: string }) {
  const actions: QuickAction[] = [
    { 
      label: "Add Product", 
      href: `${basePath}/products/new`, 
      icon: Add01Icon,
      color: "text-blue-500"
    },
    { 
      label: "View Orders", 
      href: `${basePath}/orders`, 
      icon: Invoice01Icon,
      color: "text-emerald-500"
    },
    { 
      label: "Manage Store", 
      href: `${basePath}/products`, 
      icon: ShoppingBag01Icon,
      color: "text-amber-500"
    },
    { 
      label: "Settings", 
      href: `${basePath}/settings`, 
      icon: Settings02Icon,
      color: "text-purple-500"
    },
    { 
      label: "Share Link", 
      href: storefrontUrl, 
      icon: Share01Icon, 
      external: true,
      color: "text-indigo-500"
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          target={action.external ? "_blank" : undefined}
          rel={action.external ? "noreferrer" : undefined}
          className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-5 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 active:scale-[0.98]"
        >
          <div className={cn("flex size-12 items-center justify-center transition-all duration-300 group-hover:scale-110", action.color || "text-primary")}>
            <HugeiconsIcon icon={action.icon} size={28} />
          </div>
          <span className="text-xs font-bold tracking-tight text-muted-foreground group-hover:text-foreground transition-colors">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
