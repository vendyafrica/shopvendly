"use client";

import { useState, useEffect, useRef, type MouseEvent } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  FavouriteIcon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { HeaderSkeleton } from "./skeletons";
import { useCart } from "@/features/cart/context/cart-context";
import { useWishlist } from "@/hooks/use-wishlist";
import { Bricolage_Grotesque } from "next/font/google";
import { getRootUrl } from "@/utils/misc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

export interface StoreData {
  name: string;
  slug: string;
  logoUrl?: string;
  claimable?: boolean;
}

export interface StorefrontHeaderProps {
  initialStore?: StoreData | null;
}

export default function StorefrontHeaderClient({
  initialStore,
}: StorefrontHeaderProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { itemsByStore } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [store, setStore] = useState<StoreData | null>(initialStore ?? null);
  const [isClaiming, setIsClaiming] = useState(false);
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
  const wishlistCount = wishlistItems?.length ?? 0;

  const [loading, setLoading] = useState(!initialStore);
  const [isVisible, setIsVisible] = useState(true);
  const [isOverlay, setIsOverlay] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const resolvedSlug = (() => {
    if (!params) return undefined;
    if (typeof params === "object") {
      const maybeHandle = (params as Record<string, string | undefined>).handle;
      if (typeof maybeHandle === "string" && maybeHandle.length > 0)
        return maybeHandle;
      const maybeSlug = (params as Record<string, string | undefined>).s;
      if (typeof maybeSlug === "string" && maybeSlug.length > 0)
        return maybeSlug;
    }
    return undefined;
  })();

  useEffect(() => {
    const fetchStore = async () => {
      const slug = resolvedSlug;
      if (!slug) { setLoading(false); return; }
      if (initialStore?.slug === slug) {
        setStore(initialStore);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/storefront/${slug}`);
        if (res.ok) setStore(await res.json());
      } catch (error) {
        console.error("Failed to fetch store data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [resolvedSlug, initialStore]);

  useEffect(() => {
    if (store?.slug) {
      router.prefetch(`/${store.slug}`);
      router.prefetch(`/${store.slug}/cart`);
      router.prefetch(`/${store.slug}/wishlist`);
    }
  }, [store?.slug, router]);

  const normalizedPathname = pathname?.replace(/\/$/, "") || "/";
  const slugPath = resolvedSlug ? `/${resolvedSlug}` : "/";
  const isHomePath =
    normalizedPathname === slugPath || normalizedPathname === "/";

  useEffect(() => {
    setPendingHref(null);
    lastScrollYRef.current = window.scrollY;
    setIsOverlay(isHomePath && window.scrollY < 120);

    const handleScroll = () => {
      const currentY = window.scrollY;
      const isScrollingDown = currentY > lastScrollYRef.current;
      lastScrollYRef.current = currentY;
      setIsOverlay(isHomePath && currentY < 120);

      if (currentY < 80) { setIsVisible(true); return; }
      if (isScrollingDown) { setIsVisible(false); return; }

      const rail = document.getElementById("storefront-categories-rail");
      if (!rail) { setIsVisible(true); return; }
      if (rail.getBoundingClientRect().top <= 140) setIsVisible(true);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [resolvedSlug, pathname, isHomePath]);

  if (loading) return <HeaderSkeleton />;
  if (!store) return null;

  const handleNav =
    (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.metaKey || event.ctrlKey || event.shiftKey ||
        event.altKey || event.button !== 0
      ) return;
      event.preventDefault();
      setMobileMenuOpen(false);
      setPendingHref(href);
      if (href.startsWith("http")) { window.location.href = href; return; }
      router.push(href);
    };

  const navigateTo = (href: string) => {
    setMobileMenuOpen(false);
    setPendingHref(href);
    if (href.startsWith("http")) { window.location.href = href; return; }
    router.push(href);
  };

  const handleClaimStore = async () => {
    if (!store?.slug || isClaiming) return;
    setIsClaiming(true);
    try {
      const res = await fetch(`/api/storefront/${store.slug}/claim`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; redirectTo?: string };
      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(`/${store.slug}`)}`);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to claim this store");
      router.push(data.redirectTo || "/account");
    } catch (error) {
      console.error("Claim store failed:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  const isPending = (href: string) => pendingHref === href;
  const overlayActive = isHomePath && isOverlay;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim()
    .replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const adminOrigin = appUrl
    ? appUrl
    : rootDomain
      ? `${typeof window !== "undefined" ? window.location.protocol : "https:"}//${rootDomain}`
      : getRootUrl();
  const sellerLoginUrl = store.slug
    ? `${adminOrigin}/admin/${store.slug}/login`
    : `${adminOrigin}/admin/login`;
  const claimLabel = isClaiming ? "Claiming..." : "Claim Store";

  // ─── Shared icon button classes ────────────────────────────────────────────
  const iconBtnBase =
    "relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0";
  const iconBtnOverlay = `${iconBtnBase} hover:bg-white/10`;
  const iconBtnSolid = `${iconBtnBase} hover:bg-black/5`;

  // ─── Badge ─────────────────────────────────────────────────────────────────
  const Badge = ({ count, dark = false }: { count: number; dark?: boolean }) =>
    count > 0 ? (
      <span
        className={`pointer-events-none absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-0.5 text-[10px] font-bold ring-2 ring-white
          ${dark ? "bg-neutral-900 text-white" : "bg-primary text-white"}`}
      >
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  // ─── Dropdown menu (shared between overlay + solid headers) ────────────────
  const MainMenu = ({ overlay }: { overlay?: boolean }) => {
    const totalCount = storeItemCount + wishlistCount;
    return (
      <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={overlay ? iconBtnOverlay : iconBtnSolid}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <HugeiconsIcon
                icon={Menu01Icon}
                size={20}
                className={overlay ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" : "text-neutral-900"}
              />
              <Badge count={totalCount} dark={!overlay} />
            </button>
          }
        >
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-64 rounded-2xl border border-black/8 bg-white p-2 text-neutral-900 shadow-2xl flex flex-col gap-1 z-50"
        >
          <DropdownMenuItem
            onClick={(e) => { e.preventDefault(); navigateTo(`/${store.slug}/cart`); }}
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 cursor-pointer outline-none hover:bg-neutral-100 focus:bg-neutral-100"
          >
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={ShoppingBag01Icon} size={18} />
              <span>Cart</span>
            </div>
            {storeItemCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {storeItemCount}
              </span>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(e) => { e.preventDefault(); navigateTo(`/${store.slug}/wishlist`); }}
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 cursor-pointer outline-none hover:bg-neutral-100 focus:bg-neutral-100"
          >
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={FavouriteIcon} size={18} />
              <span>Liked Items</span>
            </div>
            {wishlistCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </DropdownMenuItem>

          <div className="my-1 border-t border-black/5" />

          {store.claimable ? (
            <>
              <DropdownMenuItem
                onClick={(e) => { e.preventDefault(); handleClaimStore(); }}
                disabled={isClaiming}
                className="flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-primary outline-none hover:bg-primary/10 focus:bg-primary/10 cursor-pointer disabled:opacity-50"
              >
                {claimLabel}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.preventDefault(); navigateTo(sellerLoginUrl); }}
                className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 outline-none hover:bg-neutral-100 focus:bg-neutral-100 cursor-pointer"
              >
                Go to admin
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); navigateTo(sellerLoginUrl); }}
              className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 outline-none hover:bg-neutral-100 focus:bg-neutral-100 cursor-pointer"
            >
              Sign in to admin
            </DropdownMenuItem>
          )}

        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // ─── Desktop Actions (shared) ───────────────────────────────────────────────
  const DesktopActions = ({ overlay }: { overlay?: boolean }) => {
    return (
      <div className="hidden md:flex items-center gap-1 sm:gap-2">
        {store.claimable ? (
          <>
            <button
              type="button"
              onClick={handleClaimStore}
              disabled={isClaiming}
              className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${overlay
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
            >
              {claimLabel}
            </button>
            <button
              type="button"
              onClick={() => navigateTo(sellerLoginUrl)}
              className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${overlay ? "text-white/90 hover:text-white hover:bg-white/10" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
            >
              Admin
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => navigateTo(sellerLoginUrl)}
            className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${overlay ? "text-white/90 hover:text-white hover:bg-white/10" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
          >
            Admin
          </button>
        )}

        <div className={overlay ? "w-px h-5 bg-white/20 mx-1" : "w-px h-5 bg-black/10 mx-1"} />

        <button
          type="button"
          className={overlay ? iconBtnOverlay : iconBtnSolid}
          onClick={() => navigateTo(`/${store.slug}/wishlist`)}
          aria-label="Liked Items"
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={20}
            className={overlay ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" : "text-neutral-900"}
          />
          <Badge count={wishlistCount} dark={!overlay} />
        </button>

        <button
          type="button"
          className={overlay ? iconBtnOverlay : iconBtnSolid}
          onClick={() => navigateTo(`/${store.slug}/cart`)}
          aria-label="Cart"
        >
          <HugeiconsIcon
            icon={ShoppingBag01Icon}
            size={20}
            className={overlay ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" : "text-neutral-900"}
          />
          <Badge count={storeItemCount} dark={!overlay} />
        </button>
      </div>
    );
  };

  // ─── Nav links ─────────────────────────────────────────────────────────────
  const navLinks = [
    { label: "New Arrival", href: `/${store.slug}#new-arrivals` },
    { label: "Sale", href: `/${store.slug}#sale` },
  ];

  const headerTransition = `fixed inset-x-0 top-0 z-50 transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    }`;

  // ══════════════════════════════════════════════════════════════════════════
  // OVERLAY HEADER (hero image — transparent)
  // ══════════════════════════════════════════════════════════════════════════
  if (overlayActive) {
    return (
      <header aria-busy={Boolean(pendingHref)} className={headerTransition}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-5 flex items-center gap-4">
          {/* Store name */}
          <Link
            href={`/${store.slug}`}
            aria-busy={isPending(`/${store.slug}`)}
            onClick={handleNav(`/${store.slug}`)}
            className={`${bricolage.className} text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] font-semibold text-xl sm:text-2xl tracking-tight hover:opacity-80 transition-opacity shrink-0 ${isPending(`/${store.slug}`) ? "opacity-60" : ""
              }`}
          >
            {store.name}
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={handleNav(link.href)}
                className="text-white/90 hover:text-white transition-colors drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <DesktopActions overlay />
            <div className="md:hidden flex">
              <MainMenu overlay />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SOLID HEADER (scrolled / non-home pages)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* Page-level loading overlay */}
      {pendingHref && (
        <div className="fixed inset-0 z-100 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="h-8 w-8 rounded-full border-[3px] border-neutral-200 border-t-neutral-900 animate-spin" />
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
              Loading…
            </span>
          </div>
        </div>
      )}

      <header aria-busy={Boolean(pendingHref)} className={headerTransition}>
        <div className="bg-white/95 backdrop-blur-md border-b border-black/6 shadow-sm">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 h-[72px] sm:h-[80px]">

              {/* Store name */}
              <Link
                href={`/${store.slug}`}
                onClick={handleNav(`/${store.slug}`)}
                aria-busy={isPending(`/${store.slug}`)}
                className={`${bricolage.className} text-neutral-900 hover:text-neutral-700 font-semibold text-xl sm:text-2xl tracking-tight transition-colors shrink-0 ${isPending(`/${store.slug}`) ? "opacity-60" : ""
                  }`}
              >
                {store.name}
              </Link>

              {/* Desktop nav links */}
              <nav className="hidden md:flex items-center gap-5 text-sm font-medium shrink-0">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={handleNav(link.href)}
                    className="text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex-1" />

              {/* Right actions */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <DesktopActions />
                <div className="md:hidden flex">
                  <MainMenu />
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>
    </>
  );
}