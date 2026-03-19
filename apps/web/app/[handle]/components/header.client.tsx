"use client";

import { useState, useEffect, useRef } from "react";

import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  FavouriteIcon,
  Menu01Icon,
  UserLock01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HeaderSkeleton } from "./skeletons";
import { StorefrontSearch } from "./storefront-search";
import { StorefrontSearchModal } from "./search-modal.client";
import { useCart } from "@/features/cart/context/cart-context";
import { useWishlist } from "@/hooks/use-wishlist";
import { bricolage } from "@/utils/fonts";
import { getRootUrl } from "@/utils/misc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";
import { Button } from "@shopvendly/ui/components/button";

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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
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
  const headerVisible = isVisible;
  const headerTransition = `fixed inset-x-0 top-0 z-50 transition-all duration-300 ${headerVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    }`;

  const getAdminOrigin = () => {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl) return envUrl.trim().replace(/\/$/, "");

    const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (typeof window !== "undefined" && domain) {
      const normalizedDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
      const { protocol } = window.location;
      return `${protocol}//${normalizedDomain}`;
    }

    if (domain) {
      const normalizedDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
      return `https://${normalizedDomain}`;
    }

    return typeof window !== "undefined" ? window.location.origin : getRootUrl();
  };

  const adminOrigin = getAdminOrigin();

  const sellerLoginUrl = store?.slug
    ? `${adminOrigin}/admin/${store.slug}/login`
    : `${adminOrigin}/admin/login`;

  const isProductPage = resolvedSlug
    ? normalizedPathname.startsWith(slugPath + "/")
    : false;

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

  const overlayActive = isHomePath && isOverlay;

  // ─── Shared icon button classes ────────────────────────────────────────────
  const iconBtnBase =
    "group relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors shrink-0 sm:h-12 sm:w-12 cursor-pointer";
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
                size={24}
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
          className="w-72 rounded-2xl border border-black/8 bg-white p-2 text-neutral-900 shadow-2xl flex flex-col gap-1 z-50"
        >
          <div className="px-2 py-2 mb-1">
            <StorefrontSearch 
              storeSlug={store.slug} 
              onSubmitted={() => setMobileMenuOpen(false)} 
            />
          </div>

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
            render={
              <Link 
                href={sellerLoginUrl}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in to admin
              </Link>
            }
            className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 outline-none hover:bg-neutral-100 focus:bg-neutral-100 cursor-pointer"
          >
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const DesktopActions = ({ overlay }: { overlay?: boolean }) => {
    return (
      <div className="hidden md:flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          className={overlay ? iconBtnOverlay : iconBtnSolid}
          onClick={() => setIsSearchModalOpen(true)}
          aria-label="Search"
        >
          <HugeiconsIcon
            icon={Search01Icon}
            size={24}
            className={`${overlay ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" : "text-neutral-900"} transition-colors group-hover:text-primary`}
          />
        </button>

        <button
          type="button"
          className={overlay ? iconBtnOverlay : iconBtnSolid}
          onClick={() => router.push(`/${store.slug}/wishlist`)}
          aria-label="Liked Items"
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={24}
            className={`${overlay ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" : "text-neutral-900"} transition-colors group-hover:text-primary`}
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
            size={24}
            className={`${overlay ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" : "text-neutral-900"} transition-colors group-hover:text-primary`}
          />
          <Badge count={storeItemCount} dark={!overlay} />
        </button>

        <Link
          href={sellerLoginUrl}
          className={`${overlay ? `${iconBtnOverlay} text-white/90 hover:bg-white/10` : `${iconBtnSolid} text-red-600 hover:bg-red-50`}`}
          aria-label="Admin"
        >
          <HugeiconsIcon
            icon={UserLock01Icon}
            size={24}
            className={`${overlay ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" : ""} transition-colors group-hover:text-primary`}
          />
        </Link>
      </div>
    );
  };

  // ─── Render Conditionals ───────────────────────────────────────────────────
  
  if (isHomePath && !headerVisible) {
    return (
      <StorefrontSearchModal
        storeSlug={store.slug}
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    );
  }

  return (
    <>
      {isProductPage ? (
        <header className={headerTransition}>
          <div className="absolute inset-0 bg-white/95" />
          <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-12 h-[72px] sm:h-[80px] flex items-center relative z-10">
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-primary-50"
              >
                Back
              </Button>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="group relative flex h-12 w-12 items-center justify-center bg-transparent p-0 text-neutral-700 shadow-none cursor-pointer"
                    onClick={() => setIsSearchModalOpen(true)}
                    aria-label="Search"
                  >
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={24}
                      className="transition-colors group-hover:text-primary"
                    />
                  </button>
                  <button
                    type="button"
                    className="group relative flex h-12 w-12 items-center justify-center bg-transparent p-0 text-neutral-700 shadow-none cursor-pointer"
                    onClick={() => router.push(`/${store.slug}/wishlist`)}
                    aria-label="Liked Items"
                  >
                    <HugeiconsIcon
                      icon={FavouriteIcon}
                      size={24}
                      className="transition-colors group-hover:text-primary"
                    />
                    <Badge count={wishlistCount} dark />
                  </button>
                  <button
                    type="button"
                    className="group relative flex h-12 w-12 items-center justify-center bg-transparent p-0 text-neutral-700 shadow-none cursor-pointer"
                    onClick={() => router.push(`/${store.slug}/cart`)}
                    aria-label="Cart"
                  >
                    <HugeiconsIcon
                      icon={ShoppingBag01Icon}
                      size={24}
                      className="transition-colors group-hover:text-primary"
                    />
                    <Badge count={storeItemCount} dark={false} />
                  </button>
                  <Link
                    href={sellerLoginUrl}
                    className="group relative flex h-12 w-12 items-center justify-center bg-transparent p-0 text-red-600 shadow-none cursor-pointer"
                    aria-label="Admin"
                  >
                    <HugeiconsIcon
                      icon={UserLock01Icon}
                      size={26}
                      className="transition-colors group-hover:text-red-400"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>
      ) : (
        <header
          className={`fixed top-0 left-0 z-50 w-full bg-white/95 py-3 shadow-md transition-all duration-200 ${
            isHomePath && isOverlay ? "backdrop-blur-md bg-white/80" : "bg-white"
          } ${headerTransition}`}
        >
          <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 w-full">
              <Link
                href={`/${store.slug}`}
                className={`${bricolage.className} font-semibold text-xl sm:text-2xl tracking-tight transition-all shrink-0 ${overlayActive
                  ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] hover:opacity-80"
                  : "text-neutral-900 hover:text-neutral-700"
                  }`}
              >
                {store.name}
              </Link>

              <div className="flex-1" />

              <div className="flex items-center gap-1 sm:gap-1.5">
                <DesktopActions overlay={overlayActive} />
                <div className="md:hidden flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsSearchModalOpen(true)}
                    className={overlayActive ? iconBtnOverlay : iconBtnSolid}
                    aria-label="Search"
                  >
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={22}
                      className={overlayActive ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" : "text-neutral-900"}
                    />
                  </button>
                  <MainMenu overlay={overlayActive} />
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <StorefrontSearchModal
        storeSlug={store.slug}
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
}