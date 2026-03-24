"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  PackageOpenIcon,
  Settings01Icon,
  Home01Icon,
  ShoppingBag01Icon,
  UserMultiple02Icon,
  Loading03Icon,
  Notification01Icon,
  Payment02Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@shopvendly/ui/lib/utils";

type DockItem = {
  label: string;
  href: string;
  icon: any; 
  exact?: boolean;
  intent?: "primary";
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
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!pendingHref) return;
    const normalizedPending = normalizePath(pendingHref.split("?")[0] || pendingHref);
    const normalizedCurrent = normalizePath(pathname);
    if (normalizedCurrent === normalizedPending || normalizedCurrent.startsWith(normalizedPending + "/")) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  if (!mounted) return null;

  const items: DockItem[] = [
    { label: "Home", href: joinPaths(basePath, "/"), icon: Home01Icon, exact: true },
    { label: "Products", href: joinPaths(basePath, "/products"), icon: ShoppingBag01Icon },
    { label: "Orders", href: joinPaths(basePath, "/orders"), icon: PackageOpenIcon },
    { label: "Customers", href: joinPaths(basePath, "/customers"), icon: UserMultiple02Icon },
    { label: "Payments", href: joinPaths(basePath, "/payments"), icon: Payment02Icon },
    { label: "Activity", href: joinPaths(basePath, "/activity"), icon: Notification01Icon },
    { label: "Settings", href: joinPaths(basePath, "/settings"), icon: Settings01Icon },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center md:hidden" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}>
      <nav
        className={cn(
          "pointer-events-auto flex items-center gap-6 rounded-[28px] border border-white/10 bg-background/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out",
          "px-6 py-2 overflow-x-auto no-scrollbar max-w-[95vw]"
        )}
      >
        {items.map((item) => {
          const isActive = isActivePath(pathname, item);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              onClick={() => {
                setPendingHref(item.href);
              }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all duration-200 ease-out shrink-0",
                "min-w-[56px] py-1",
                item.intent === "primary" ? "bg-primary/10 text-primary" : isActive ? "text-primary" : "text-muted-foreground",
                "hover:bg-muted/50"
              )}
            >
              {pendingHref === item.href ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  className={cn(
                    "animate-spin transition-all duration-200",
                    "size-5.5",
                    "text-primary"
                  )}
                />
              ) : (
                <HugeiconsIcon
                  icon={item.icon}
                  className={cn(
                    "transition-all duration-200",
                    "size-5.5",
                    (isActive || item.intent === "primary") && "text-primary"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-[10px] font-bold leading-none transition-all duration-200",
                  "opacity-100 translate-y-0 scale-100",
                  isActive ? "text-primary tracking-tight" : "text-slate-500"
                )
              }
              >
                {item.label}
              </span>
              {isActive ? (
                <span className="absolute inset-x-0 -bottom-1 mx-auto h-1 w-6 rounded-t-full bg-primary" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
