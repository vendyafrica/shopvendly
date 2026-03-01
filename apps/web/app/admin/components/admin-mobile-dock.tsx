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
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@shopvendly/ui/lib/utils";

type DockItem = {
  label: string;
  href: string;
  icon: typeof Home01Icon;
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
  const [isCompact, setIsCompact] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let lastY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      const current = window.scrollY;
      const delta = current - lastY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Expand when near top
          if (current < 24) {
            setIsCompact(false);
          } else if (delta > 4) {
            // scrolling down
            setIsCompact(true);
          } else if (delta < -4) {
            // scrolling up
            setIsCompact(false);
          }
          lastY = current;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
    { label: "Orders", href: joinPaths(basePath, "/transactions"), icon: PackageOpenIcon },
    { label: "Settings", href: joinPaths(basePath, "/settings"), icon: Settings01Icon },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center md:hidden" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)" }}>
      <nav
        className={cn(
          "pointer-events-auto flex w-[95vw] max-w-xl items-center gap-2 rounded-3xl border border-white/10 bg-background/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out",
          isCompact ? "px-5 py-1" : "px-6 py-1"
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
                "relative flex flex-1 min-w-0 shrink-0 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200 ease-out",
                isCompact ? "py-1" : "py-1",
                item.intent === "primary" ? "bg-primary/10 text-primary" : isActive ? "text-primary" : "text-muted-foreground",
                !isCompact && "hover:bg-muted/50"
              )}
            >
              {pendingHref === item.href ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  className={cn(
                    "animate-spin transition-all duration-200",
                    isCompact ? "size-5" : "size-6",
                    "text-primary"
                  )}
                />
              ) : (
                <HugeiconsIcon
                  icon={item.icon}
                  className={cn(
                    "transition-all duration-200",
                    isCompact ? "size-5" : "size-6",
                    (isActive || item.intent === "primary") && "text-primary"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-all duration-200",
                  isCompact ? "opacity-0 translate-y-1 scale-95 h-0" : "opacity-100 translate-y-0 scale-100 h-3",
                  isActive && "font-semibold"
                )}
                aria-hidden={isCompact}
              >
                {item.label}
              </span>
              {isActive ? (
                <span className="absolute inset-x-0 -bottom-px mx-auto h-1 w-8 rounded-t-full bg-primary/20" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
