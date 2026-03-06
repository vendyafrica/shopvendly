"use client";

import { useState, useEffect, useRef } from "react";

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
}

export interface StorefrontHeaderProps {
  initialStore?: StoreData | null;
}

function Badge({ count, dark = false }: { count: number; dark?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`pointer-events-none absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-0.5 text-[10px] font-bold ring-2 ring-white
        ${dark ? "bg-neutral-900 text-white" : "bg-primary text-white"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
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
  const isProductPage = resolvedSlug
    ? normalizedPathname.startsWith(slugPath + "/")
    : false;
  const headerVisible = isVisible;
  const headerTransition = `fixed inset-x-0 top-0 z-50 transition-all duration-300 ${headerVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    }`;

  useEffect(() => {
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

  if (isProductPage) {
    return (
      <header className={headerTransition}>
        <div className="absolute inset-0 bg-white/95" />
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-12 h-[72px] sm:h-[80px] flex items-center relative z-10">
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <span aria-hidden>←</span>
              Back
            </button>
            <div className="flex items-center gap-2">
              <div className="flex md:hidden items-center gap-1">
                <button
                  type="button"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50"
                  onClick={() => router.push(`/${store.slug}/wishlist`)}
                  aria-label="Liked Items"
                >
                  <HugeiconsIcon icon={FavouriteIcon} size={18} />
                  <Badge count={wishlistCount} dark />
                </button>
                <button
                  type="button"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50"
                  onClick={() => router.push(`/${store.slug}/cart`)}
                  aria-label="Cart"
                >
                  <HugeiconsIcon icon={ShoppingBag01Icon} size={18} />
                  <Badge count={storeItemCount} dark />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (sellerLoginUrl.startsWith("http")) {
                    window.location.href = sellerLoginUrl;
                    return;
                  }
                  router.push(sellerLoginUrl);
                }}
                className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const overlayActive = isHomePath && isOverlay;

  const getAdminOrigin = () => {
    // We must always point to the ROOT domain, never the storefront subdomain.
    // The proxy middleware explicitly blocks /admin paths on subdomains and
    // redirects them back to /, so window.location.origin is wrong here.
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl) return envUrl.trim().replace(/\/$/, "");

    const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (typeof window !== "undefined" && domain) {
      // Strip the subdomain from the current hostname and rebuild root origin.
      // e.g. "mystore.shopvendly.store" -> "shopvendly.store"
      const normalizedDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
      const { protocol } = window.location;
      return `${protocol}//${normalizedDomain}`;
    }

    if (domain) {
      const normalizedDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
      return `https://${normalizedDomain}`;
    }

    // Fallback: trust environment
    return typeof window !== "undefined" ? window.location.origin : getRootUrl();
  };

  const adminOrigin = getAdminOrigin();

  const sellerLoginUrl = store.slug
    ? `${adminOrigin}/admin/${store.slug}/login`
    : `${adminOrigin}/admin/login`;

  // ─── Shared icon button classes ────────────────────────────────────────────
  const iconBtnBase =
    "relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0";
  const iconBtnOverlay = `${iconBtnBase} hover:bg-white/10`;
  const iconBtnSolid = `${iconBtnBase} hover:bg-black/5`;

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
            onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); router.push(`/${store.slug}/cart`); }}
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
            onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); router.push(`/${store.slug}/wishlist`); }}
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

          <DropdownMenuItem
            onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); if (sellerLoginUrl.startsWith("http")) { window.location.href = sellerLoginUrl; return; } router.push(sellerLoginUrl); }}
            className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 outline-none hover:bg-neutral-100 focus:bg-neutral-100 cursor-pointer"
          >
            Sign in to admin
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // ─── Desktop Actions (shared) ───────────────────────────────────────────────
  const DesktopActions = ({ overlay }: { overlay?: boolean }) => {
    return (
      <div className="hidden md:flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => { if (sellerLoginUrl.startsWith("http")) { window.location.href = sellerLoginUrl; return; } router.push(sellerLoginUrl); }}
          className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${overlay ? "text-white/90 hover:text-white hover:bg-white/10" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
        >
          Admin
        </button>

        <div className={overlay ? "w-px h-5 bg-white/20 mx-1" : "w-px h-5 bg-black/10 mx-1"} />

        <button
          type="button"
          className={overlay ? iconBtnOverlay : iconBtnSolid}
          onClick={() => router.push(`/${store.slug}/wishlist`)}
          aria-label="Liked Items"
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={20}
            className={overlay ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" : "text-neutral-900"}
          />
          <Badge count={wishlistCount} dark={!overlay} />
        </button>

        <button
          type="button"
          className={overlay ? iconBtnOverlay : iconBtnSolid}
          onClick={() => router.push(`/${store.slug}/cart`)}
          aria-label="Cart"
        >
          <HugeiconsIcon
            icon={ShoppingBag01Icon}
            size={20}
            className={overlay ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" : "text-neutral-900"}
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

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <header className={headerTransition}>
      {/* 
        Solid background layer - only visible when not in overlay mode.
        We keep the same header container and just toggle classes/children
        style to ensure the React component tree (IDs) stays stable.
      */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${overlayActive ? "opacity-0 pointer-events-none" : "opacity-100"
        } bg-white/95 backdrop-blur-md border-b border-black/6 shadow-sm`} />

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 h-[72px] sm:h-[80px] flex items-center relative z-10 transition-colors duration-300">
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6 w-full">
          {/* Store name */}
          <Link
            href={`/${store.slug}`}
            className={`${bricolage.className} font-semibold text-xl sm:text-2xl tracking-tight transition-all shrink-0 ${overlayActive
              ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] hover:opacity-80"
              : "text-neutral-900 hover:text-neutral-700"
              }`}
          >
            {store.name}
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`transition-colors ${overlayActive
                  ? "text-white/90 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                  : "text-neutral-600 hover:text-neutral-900"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <DesktopActions overlay={overlayActive} />
            <div className="md:hidden flex">
              <MainMenu overlay={overlayActive} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}