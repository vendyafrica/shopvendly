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
      href: `${basePath}/products?quickAdd=1`, 
      icon: Add01Icon,
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    { 
      label: "View Orders", 
      href: `${basePath}/transactions`, 
      icon: Invoice01Icon,
      color: "bg-purple-50 text-purple-600 border-purple-100"
    },
    { 
      label: "Manage Store", 
      href: `${basePath}/products`, 
      icon: ShoppingBag01Icon,
      color: "bg-amber-50 text-amber-600 border-amber-100"
    },
    { 
      label: "Share Link", 
      href: storefrontUrl, 
      icon: Share01Icon, 
      external: true,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:gap-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          target={action.external ? "_blank" : undefined}
          rel={action.external ? "noreferrer" : undefined}
          className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-4 text-center transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className={cn("flex size-10 items-center justify-center rounded-xl border transition-colors group-hover:bg-primary/5", action.color)}>
            <HugeiconsIcon icon={action.icon} size={20} />
          </div>
          <span className="text-xs font-semibold tracking-tight text-muted-foreground group-hover:text-foreground">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
