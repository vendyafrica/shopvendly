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
  MenuSquareIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@shopvendly/ui/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@shopvendly/ui/components/sheet";

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

  const primary: DockItem[] = [
    { label: "Home", href: "/", icon: NineCircleIcon, exact: true },
    { label: "Tenants", href: "/tenants", icon: UserMultiple02Icon },
    { label: "Stores", href: "/stores", icon: Store01Icon },
    { label: "Categories", href: "/categories", icon: GroupLayersIcon },
    { label: "Users", href: "/users", icon: UserGroupIcon },
  ];

  const more: DockItem[] = [
    { label: "Payments", href: "/payments", icon: Payment02Icon },
    { label: "Orders", href: "/orders", icon: PackageOpenIcon },
    { label: "Analytics", href: "/analytics", icon: Analytics02Icon },
    { label: "Settings", href: "/settings", icon: Settings01Icon },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
      <nav className="flex items-center justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {primary.map((item) => {
          const isActive = isActivePath(pathname, item);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "relative flex h-11 w-14 items-center justify-center rounded-full transition-colors",
                isActive ? "text-foreground bg-muted" : "text-muted-foreground"
              )}
            >
              <HugeiconsIcon icon={item.icon} className={cn("size-6", isActive ? "opacity-100" : "opacity-90")} />
              {isActive ? <span className="absolute -top-1 h-1 w-6 rounded-full bg-primary" /> : null}
            </Link>
          );
        })}

        <Sheet>
          <SheetTrigger
            aria-label="More"
            className={cn(
              "relative flex h-11 w-14 items-center justify-center rounded-full text-muted-foreground transition-colors"
            )}
          >
            <HugeiconsIcon icon={MenuSquareIcon} className="size-6" />
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="grid gap-2 px-4 pb-4">
              {more.map((item) => {
                const isActive = isActivePath(pathname, item);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-3 text-sm",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <HugeiconsIcon icon={item.icon} className="size-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
