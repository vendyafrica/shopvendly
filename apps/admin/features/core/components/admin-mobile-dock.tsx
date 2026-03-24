"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  NineCircleIcon,
  UserMultiple02Icon,
  Store01Icon,
  GroupLayersIcon,
  UserGroupIcon,
  Payment02Icon,
  PackageOpenIcon,
  Analytics02Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@shopvendly/ui/lib/utils";

type DockItem = {
  label: string;
  href: string;
  icon: typeof NineCircleIcon;
  exact?: boolean;
};

function normalizePath(path: string) {
  const resolved = path.replace(/\/+/g, "/").replace(/\/$/, "");
  return resolved === "" ? "/" : resolved;
}

function isActivePath(pathname: string, item: DockItem) {
  const itemHref = normalizePath(item.href);
  const current = normalizePath(pathname);

  if (item.exact) return current === itemHref;
  return current === itemHref || current.startsWith(itemHref + "/");
}

export function AdminMobileDock() {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const dockItems: DockItem[] = [
    { label: "Home", href: "/dashboard", icon: NineCircleIcon, exact: true },
    { label: "Stores", href: "/stores", icon: Store01Icon },
    { label: "Orders", href: "/orders", icon: PackageOpenIcon },
    { label: "Payments", href: "/payments", icon: Payment02Icon },
    { label: "Users", href: "/users", icon: UserGroupIcon },
    { label: "Tenants", href: "/tenants", icon: UserMultiple02Icon },
    { label: "Categories", href: "/categories", icon: GroupLayersIcon },
    { label: "Analytics", href: "/analytics", icon: Analytics02Icon },
    { label: "Settings", href: "/settings", icon: Settings01Icon },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
      <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth px-4 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] snap-x snap-mandatory">
        {dockItems.map((item) => {
          const isActive = isActivePath(pathname, item);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "relative flex h-11 w-14 shrink-0 snap-center items-center justify-center rounded-full transition-colors",
                isActive ? "text-foreground bg-muted" : "text-muted-foreground"
              )}
            >
              <HugeiconsIcon icon={item.icon} className={cn("size-6", isActive ? "opacity-100" : "opacity-90")} />
              {isActive ? <span className="absolute -top-1 h-1 w-6 rounded-full bg-primary" /> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
