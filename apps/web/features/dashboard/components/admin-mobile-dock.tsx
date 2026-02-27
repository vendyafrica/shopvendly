"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardCircleIcon,
  ShoppingBag01Icon,
  PackageOpenIcon,
  Analytics02Icon,
  Message01Icon,
  CustomerServiceIcon,
  ConnectIcon,
  Settings01Icon,
  Store01Icon,
  Home01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@shopvendly/ui/lib/utils";

type DockItem = {
  label: string;
  href: string;
  icon: typeof DashboardCircleIcon;
  exact?: boolean;
};

function normalizePath(path: string) {
  const resolved = path.replace(/\/+/g, "/").replace(/\/$/, "");
  return resolved === "" ? "/" : resolved;
}

function joinPaths(a: string, b: string) {
  const left = a.endsWith("/") ? a.slice(0, -1) : a;
  const right = b.startsWith("/") ? b : `/${b}`;
  return normalizePath(`${left}${right}`);
}

function isActivePath(pathname: string, item: DockItem) {
  const itemHref = normalizePath(item.href);
  const current = normalizePath(pathname);

  if (item.exact) return current === itemHref;
  return current === itemHref || current.startsWith(itemHref + "/");
}

export function AdminMobileDock({ basePath }: { basePath: string }) {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const items: DockItem[] = [
    { label: "Home", href: joinPaths(basePath, "/"), icon: Home01Icon, exact: true },
    { label: "Products", href: joinPaths(basePath, "/products"), icon: ShoppingBag01Icon },
    { label: "Transactions", href: joinPaths(basePath, "/transactions"), icon: PackageOpenIcon },
    { label: "Notifications", href: joinPaths(basePath, "/notifications"), icon: Message01Icon },
    { label: "Studio", href: joinPaths(basePath, "/studio"), icon: Store01Icon },
    { label: "Analytics", href: joinPaths(basePath, "/analytics"), icon: Analytics02Icon },
    { label: "Customers", href: joinPaths(basePath, "/customers"), icon: CustomerServiceIcon },
    { label: "Integrations", href: joinPaths(basePath, "/integrations"), icon: ConnectIcon },
    { label: "Settings", href: joinPaths(basePath, "/settings"), icon: Settings01Icon },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
      <nav className="flex items-center gap-1 overflow-x-auto px-4 py-2 no-scrollbar">
        {items.map((item) => {
          const isActive = isActivePath(pathname, item);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "relative flex min-w-[4.5rem] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors hover:bg-muted/50",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                className={cn("size-6", isActive && "text-primary")}
              />
              <span className={cn("text-[10px] font-medium leading-none", isActive && "font-semibold")}>
                {item.label}
              </span>
              {isActive ? (
                <span className="absolute inset-x-0 -bottom-[1px] mx-auto h-1 w-8 rounded-t-full bg-primary/20" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
