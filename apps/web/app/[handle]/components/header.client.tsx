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
import { signInWithGoogle } from "@shopvendly/auth/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

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
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleSigningIn(true);
      await signInWithGoogle({
        callbackURL: `/${store?.slug || ""}`,
      });
    } catch {
      setIsGoogleSigningIn(false);
    }
  };

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

          <DropdownMenuItem
            onClick={(e) => { e.preventDefault(); handleGoogleSignIn(); }}
            disabled={isGoogleSigningIn}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 outline-none hover:bg-neutral-100 focus:bg-neutral-100 cursor-pointer disabled:opacity-50 mt-1 border border-neutral-200"
          >
            {isGoogleSigningIn ? (
              <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
            <MainMenu overlay />
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
                <MainMenu />
              </div>

            </div>
          </div>
        </div>
      </header>
    </>
  );
}