"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  ShoppingBag02Icon,
  UserIcon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons";
import { HeaderSkeleton } from "./skeletons";
import { useCart } from "@/features/cart/context/cart-context";
import { Bricolage_Grotesque } from "next/font/google";
import { getRootUrl } from "@/utils/misc";

const geistSans = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

interface StoreData {
  name: string;
  slug: string;
  logoUrl?: string;
}

interface StorefrontHeaderProps {
  initialStore?: StoreData | null;
}

export function StorefrontHeader({ initialStore }: StorefrontHeaderProps) {
  const params = useParams();
  const pathname = usePathname();
  const { itemsByStore } = useCart();
  const [store, setStore] = useState<StoreData | null>(initialStore ?? null);

  // Derive storeId matching the currently loaded slug context to show accurate item count
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (!store) return;
    let foundId = null;
    for (const [id, items] of Object.entries(itemsByStore)) {
      if (items[0]?.store?.slug === store.slug) {
        foundId = id;
        break;
      }
    }
    setStoreId(foundId);
  }, [itemsByStore, store]);

  const storeItems = storeId ? itemsByStore[storeId] : [];
  const storeItemCount = storeItems ? storeItems.length : 0;

  const [loading, setLoading] = useState(!initialStore);
  const [isVisible, setIsVisible] = useState(true);
  const [isOverlay, setIsOverlay] = useState(true);
  const lastScrollYRef = useRef(0);

  const resolvedSlug = (() => {
    if (!params) return undefined;
    if (typeof params === "object") {
      const maybeHandle = (params as Record<string, string | undefined>).handle;
      if (typeof maybeHandle === "string" && maybeHandle.length > 0) {
        return maybeHandle;
      }
      const maybeSlug = (params as Record<string, string | undefined>).s;
      if (typeof maybeSlug === "string" && maybeSlug.length > 0) {
        return maybeSlug;
      }
    }
    return undefined;
  })();

  useEffect(() => {
    const fetchStore = async () => {
      const slug = resolvedSlug;

      if (!slug) {
        setLoading(false);
        return;
      }

      if (initialStore?.slug === slug) {
        setStore(initialStore);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/storefront/${slug}`);
        if (res.ok) {
          setStore(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch store data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [resolvedSlug, initialStore]);

  const normalizedPathname = pathname?.replace(/\/$/, "") || "/";
  const slugPath = resolvedSlug ? `/${resolvedSlug}` : "/";
  const isHomePath = normalizedPathname === slugPath || normalizedPathname === "/";

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    // Only allow overlay effect on the home/hero page (slug route or subdomain root); otherwise force solid header
    setIsOverlay(isHomePath && window.scrollY < 120);

    const handleScroll = () => {
      const currentY = window.scrollY;
      const isScrollingDown = currentY > lastScrollYRef.current;
      lastScrollYRef.current = currentY;

      setIsOverlay(isHomePath && currentY < 120);

      // Always show when you're basically at the top.
      if (currentY < 80) {
        setIsVisible(true);
        return;
      }

      // Hide while scrolling down.
      if (isScrollingDown) {
        setIsVisible(false);
        return;
      }

      // Scrolling up: only show again when near the categories rail.
      const rail = document.getElementById("storefront-categories-rail");
      if (!rail) {
        // No rail on detail pages; keep header visible when scrolling up
        setIsVisible(true);
        return;
      }

      const railTop = rail.getBoundingClientRect().top;
      const headerRevealThreshold = 140;
      if (railTop <= headerRevealThreshold) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [resolvedSlug, pathname, isHomePath]);

  if (loading) return <HeaderSkeleton />;
  if (!store) return null;

  const isHomePage = isHomePath;

  // Avoid double headers on the storefront home (hero) page; hero renders its own inline header.
  if (isHomePage) return null;

  const overlayActive = isHomePath && isOverlay;
  const textColorClass = overlayActive
    ? "text-white hover:text-white/90"
    : "text-foreground hover:text-foreground/80";

  const barClass = overlayActive
    ? "bg-transparent"
    : "bg-background border-b border-border";

  const iconColor = overlayActive ? "text-white" : "text-foreground";
  const sellerLoginUrl = store.slug
    ? getRootUrl(`/admin/${store.slug}/login`)
    : getRootUrl("/admin/login");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
    >
      <div className={`relative ${barClass}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex items-center gap-4 sm:gap-6 md:gap-8 h-16 sm:h-[70px] md:h-20">
            {/* Left: Store name */}
            <div className="min-w-[120px] sm:min-w-[160px] flex items-center gap-3">
              <Link
                href={`/${store.slug}`}
                className={`${geistSans.className} ${textColorClass} font-semibold text-xl sm:text-xl tracking-tight transition-colors`}
              >
                {store.name}
              </Link>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center gap-1 sm:gap-1 ml-auto">
              <Link
                href={`/${store.slug}/cart`}
                className={`relative inline-flex h-10 w-10 items-center cursor-pointer justify-center transition-colors ${isHomePage ? "hover:opacity-80" : "hover:bg-muted/70 rounded-full"}`}
                aria-label="Cart"
              >
                <HugeiconsIcon
                  icon={ShoppingBag02Icon}
                  size={18}
                  className={iconColor}
                />
                {storeItemCount > 0 && (
                  <span
                    className={`pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white ${isHomePage ? "bg-black/90 ring-2 ring-white/60" : "bg-neutral-900 ring-2 ring-white"}`}
                  >
                    {storeItemCount > 99 ? "99+" : storeItemCount}
                  </span>
                )}
              </Link>

              <Link
                href="/wishlist"
                className={`relative inline-flex h-10 w-10 items-center justify-center transition-colors ${isHomePage ? "hover:opacity-80" : "hover:bg-muted/70 rounded-full"}`}
                aria-label="Wishlist"
              >
                <HugeiconsIcon
                  icon={FavouriteIcon}
                  size={18}
                  className={iconColor}
                />
              </Link>

              <Link
                href={sellerLoginUrl}
                className={`relative inline-flex h-10 w-10 items-center justify-center transition-colors ${isHomePage ? "hover:opacity-80" : "hover:bg-muted/70 rounded-full"}`}
                aria-label="Account"
              >
                <HugeiconsIcon
                  icon={UserIcon}
                  size={18}
                  className={iconColor}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

    </header>
  );
}
