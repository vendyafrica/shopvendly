"use client";

import { useState, useEffect, useRef, type MouseEvent } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  FavouriteIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HeaderSkeleton } from "./skeletons";
import { useCart } from "@/features/cart/context/cart-context";
import { useWishlist } from "@/hooks/use-wishlist";
import { Bricolage_Grotesque } from "next/font/google";
import { getRootUrl } from "@/utils/misc";
import { Input } from "@shopvendly/ui/components/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";

const geistSans = Bricolage_Grotesque({
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
    }
    router.prefetch("/wishlist");
  }, [store?.slug, router]);

  const normalizedPathname = pathname?.replace(/\/$/, "") || "/";
  const slugPath = resolvedSlug ? `/${resolvedSlug}` : "/";
  const isHomePath =
    normalizedPathname === slugPath || normalizedPathname === "/";

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    setIsOverlay(isHomePath && window.scrollY < 120);

    const handleScroll = () => {
      const currentY = window.scrollY;
      const isScrollingDown = currentY > lastScrollYRef.current;
      lastScrollYRef.current = currentY;

      setIsOverlay(isHomePath && currentY < 120);

      if (currentY < 80) {
        setIsVisible(true);
        return;
      }
      if (isScrollingDown) {
        setIsVisible(false);
        return;
      }

      const rail = document.getElementById("storefront-categories-rail");
      if (!rail) {
        setIsVisible(true);
        return;
      }

      const railTop = rail.getBoundingClientRect().top;
      if (railTop <= 140) setIsVisible(true);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [resolvedSlug, pathname, isHomePath]);

  if (loading) return <HeaderSkeleton />;
  if (!store) return null;

  const handleNav =
    (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      event.preventDefault();
      setMobileMenuOpen(false);
      setPendingHref(href);
      if (href.startsWith("http")) {
        window.location.href = href;
        return;
      }
      router.push(href);
    };

  const navigateTo = (href: string) => {
    setMobileMenuOpen(false);
    setPendingHref(href);
    if (href.startsWith("http")) {
      window.location.href = href;
      return;
    }
    router.push(href);
  };

  const isPending = (href: string) => pendingHref === href;

  const overlayActive = isHomePath && isOverlay;
  const sellerLoginUrl = store.slug
    ? getRootUrl(`/admin/${store.slug}/login`)
    : getRootUrl("/admin/login");

  const searchClasses =
    "w-[420px] max-w-full h-11 rounded-full border border-neutral-200 bg-white px-5 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus-within:border-primary/50 focus-within:ring-[3px] focus-within:ring-primary/10 ";

  if (overlayActive) {
    return (
      <header
        aria-busy={Boolean(pendingHref)}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-10 py-5 flex items-center gap-4 sm:gap-6 md:gap-8">
          {/* Store name */}
          <Link
            href={`/${store.slug}`}
            aria-busy={isPending(`/${store.slug}`)}
            onClick={handleNav(`/${store.slug}`)}
            className={`${geistSans.className} text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] font-semibold text-xl sm:text-2xl tracking-tight hover:text-white/85 transition-colors ${
              isPending(`/${store.slug}`) ? "opacity-70" : ""
            }`}
          >
            {store.name}
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium tracking-tight text-white">
            {[
              { label: "New Arrival", href: `/${store.slug}#new-arrivals` },
              { label: "Sale", href: `/${store.slug}#sale` },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={handleNav(link.href)}
                className="text-white hover:text-white/80 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="hidden lg:flex flex-1 justify-center items-center">
            <Input
              type="text"
              aria-label="Search products"
              placeholder="What are you looking for?"
              className={searchClasses}
              suppressHydrationWarning
            />
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Cart */}
            <Link
              href={`/${store.slug}/cart`}
              aria-busy={isPending(`/${store.slug}/cart`)}
              onClick={handleNav(`/${store.slug}/cart`)}
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/30 backdrop-blur-sm hover:bg-black/45 transition-colors ${
                isPending(`/${store.slug}/cart`) ? "opacity-60" : ""
              }`}
              aria-label="Cart"
            >
              <HugeiconsIcon
                icon={ShoppingBag01Icon}
                size={20}
                className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
              />
              {isPending(`/${store.slug}/cart`) && (
                <span
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  aria-hidden
                >
                  <span className="h-4 w-4 rounded-full border-2 border-neutral-800/60 border-t-transparent animate-spin" />
                </span>
              )}
              {storeItemCount > 0 && (
                <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground bg-primary ring-2 ring-white">
                  {storeItemCount > 99 ? "99+" : storeItemCount}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              aria-busy={isPending("/wishlist")}
              onClick={handleNav("/wishlist")}
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/30 backdrop-blur-sm hover:bg-black/45 transition-colors ${
                isPending("/wishlist") ? "opacity-60" : ""
              }`}
              aria-label="Wishlist"
            >
              <HugeiconsIcon
                icon={FavouriteIcon}
                size={20}
                className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
              />
              {isPending("/wishlist") && (
                <span
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  aria-hidden
                >
                  <span className="h-4 w-4 rounded-full border-2 border-neutral-800/60 border-t-transparent animate-spin" />
                </span>
              )}
              {wishlistCount > 0 && (
                <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground bg-primary ring-2 ring-white">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            {/* Mobile menu toggle */}
            <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DropdownMenuTrigger
                className="inline-flex md:hidden h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/30 backdrop-blur-sm hover:bg-black/45 transition-colors"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                <HugeiconsIcon
                  icon={UserCircleIcon}
                  size={20}
                  className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-56 rounded-xl border border-white/20 bg-white/95 p-1 text-neutral-900 shadow-xl backdrop-blur-sm"
              >
                <DropdownMenuItem
                  onClick={() => navigateTo(sellerLoginUrl)}
                  className="rounded-lg px-3 py-2 text-sm font-medium"
                >
                  Sign in to admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Sign In */}
            <Link
              href={sellerLoginUrl}
              onClick={handleNav(sellerLoginUrl)}
              className="hidden sm:inline-flex items-center rounded-full bg-neutral-900 text-white px-4 py-2 text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      aria-busy={Boolean(pendingHref)}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="relative">
        <div className="bg-white/95 backdrop-blur border-b border-black/5">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
            <div className="flex items-center gap-4 sm:gap-6 md:gap-8 h-[82px]">
              {/* Store name */}
              <div className="min-w-[140px] sm:min-w-[180px] flex items-center gap-3">
                <Link
                  href={`/${store.slug}`}
                  onClick={handleNav(`/${store.slug}`)}
                  aria-busy={isPending(`/${store.slug}`)}
                  className={`${geistSans.className} text-neutral-900 hover:text-neutral-800 font-semibold text-2xl tracking-tight transition-colors ${
                    isPending(`/${store.slug}`) ? "opacity-70" : ""
                  }`}
                >
                  {store.name}
                </Link>
              </div>

              {/* Nav links */}
              <nav className="hidden md:flex items-center gap-5 text-sm font-medium tracking-tight">
                {[
                  { label: "New Arrival", href: `/${store.slug}#new-arrivals` },
                  { label: "Sale", href: `/${store.slug}#sale` },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={handleNav(link.href)}
                    className="text-neutral-900 hover:text-neutral-800 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Search */}
              <div className="hidden lg:flex flex-1 justify-center items-center">
                <Input
                  type="text"
                  aria-label="Search products"
                  placeholder="What are you looking for?"
                  className={searchClasses}
                />
              </div>

              {/* Icons */}
              <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                {/* Mobile menu toggle */}
                <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <DropdownMenuTrigger
                    className="inline-flex md:hidden h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                  >
                    <HugeiconsIcon
                      icon={UserCircleIcon}
                      size={20}
                      className="text-neutral-900"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-56 rounded-xl border border-black/10 bg-white p-1 text-neutral-900 shadow-xl"
                  >
                    <DropdownMenuItem
                      onClick={() => navigateTo(sellerLoginUrl)}
                      className="rounded-lg px-3 py-2 text-sm font-medium"
                    >
                      Sign in to admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Cart */}
                <Link
                  href={`/${store.slug}/cart`}
                  onClick={handleNav(`/${store.slug}/cart`)}
                  aria-busy={isPending(`/${store.slug}/cart`)}
                  className={`relative inline-flex h-11 w-11 items-center cursor-pointer justify-center rounded-full transition-colors hover:bg-black/5 ${
                    isPending(`/${store.slug}/cart`) ? "opacity-60" : ""
                  }`}
                  aria-label="Cart"
                >
                  <HugeiconsIcon
                    icon={ShoppingBag01Icon}
                    size={20}
                    className="text-neutral-900"
                  />
                  {isPending(`/${store.slug}/cart`) && (
                    <span
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      aria-hidden
                    >
                      <span className="h-4 w-4 rounded-full border-2 border-foreground/60 border-t-transparent animate-spin" />
                    </span>
                  )}
                  {storeItemCount > 0 && (
                    <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white bg-neutral-900 ring-2 ring-white">
                      {storeItemCount > 99 ? "99+" : storeItemCount}
                    </span>
                  )}
                </Link>

                {/* Wishlist */}
                <Link
                  href="/wishlist"
                  onClick={handleNav("/wishlist")}
                  aria-busy={isPending("/wishlist")}
                  className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/5 ${
                    isPending("/wishlist") ? "opacity-60" : ""
                  }`}
                  aria-label="Wishlist"
                >
                  <HugeiconsIcon
                    icon={FavouriteIcon}
                    size={20}
                    className="text-neutral-900"
                  />
                  {isPending("/wishlist") && (
                    <span
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      aria-hidden
                    >
                      <span className="h-4 w-4 rounded-full border-2 border-foreground/60 border-t-transparent animate-spin" />
                    </span>
                  )}
                </Link>

                {/* Sign In */}
                <Link
                  href={sellerLoginUrl}
                  onClick={handleNav(sellerLoginUrl)}
                  className="hidden sm:inline-flex items-center rounded-full border border-black/10 bg-black/5 text-neutral-900 px-4 py-2 text-sm font-semibold hover:bg-black/10 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
