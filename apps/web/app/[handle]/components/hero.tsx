"use client";

import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon, Menu01Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { Bricolage_Grotesque } from "next/font/google";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";
import { useCart } from "@/features/cart/context/cart-context";
import { useWishlist } from "@/hooks/use-wishlist";
import { getRootUrl } from "@/utils/misc";

import { DeferredHeroVideo } from "./deferred-hero-video";
import { HeroScrollCta } from "./hero-scroll-cta.client";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-0.5 text-[10px] font-bold text-neutral-900 ring-2 ring-black/10">
      {count > 99 ? "99+" : count}
    </span>
  );
}

interface HeroProps {
  store: {
    name: string;
    description: string | null;
    slug?: string;
    logoUrl?: string | null;
    heroMedia?: string[];
  };
}

const FALLBACK_HERO_MEDIA =
  "https://cdn.cosmos.so/08020ebf-2819-4bb1-ab66-ae3642a73697.mp4";
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"];

function isUploadThingBlobUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(".ufs.sh") || parsed.hostname === "utfs.io";
  } catch {
    return /(?:\.ufs\.sh|utfs\.io)/i.test(url);
  }
}

function hasLikelyImageExtension(url: string) {
  const cleanUrl = url.split("?")[0]?.split("#")[0] ?? url;
  const lower = cleanUrl.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isVideoUrl(url: string) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();

    const typeParam =
      parsed.searchParams.get("x-ut-file-type") ||
      parsed.searchParams.get("file-type");
    if (typeParam && typeParam.toLowerCase().startsWith("video")) return true;

    const hasVideoExt = VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
    if (hasVideoExt) return true;

    return false;
  } catch {
    const cleanUrl = url.split("?")[0]?.split("#")[0] ?? url;
    const lower = cleanUrl.toLowerCase();
    const hasVideoExt = VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (hasVideoExt) return true;

    return false;
  }
}

export function Hero({ store }: HeroProps) {
  const { itemsByStore } = useCart();
  const { items: wishlistItems } = useWishlist();
  const heroMedia = Array.isArray(store.heroMedia) ? store.heroMedia : [];
  const mediaUrl = heroMedia[0] || FALLBACK_HERO_MEDIA;
  const isUploadThing = typeof mediaUrl === "string" && isUploadThingBlobUrl(mediaUrl);
  const looksLikeImage = typeof mediaUrl === "string" && hasLikelyImageExtension(mediaUrl);

  const isVideo =
    typeof mediaUrl === "string" &&
    (isVideoUrl(mediaUrl) || (isUploadThing && !looksLikeImage));

  const shouldUseNativeImg =
    typeof mediaUrl === "string" && isUploadThing && looksLikeImage;
  const fallbackPoster = "/og-image.png";

  const heroDescription =
    store.description ||
    "Discover elevated basics, sculpted silhouettes, and effortless ease.";

  const storeItems = Object.values(itemsByStore).find((items) => items[0]?.store?.slug === store.slug) ?? [];
  const storeItemCount = storeItems.length;
  const wishlistCount = wishlistItems?.length ?? 0;
  const totalCount = storeItemCount + wishlistCount;
  const adminOrigin = (() => {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl) return envUrl.trim().replace(/\/$/, "");

    const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (typeof window !== "undefined" && domain) {
      const normalizedDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
      return `${window.location.protocol}//${normalizedDomain}`;
    }

    if (domain) {
      const normalizedDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
      return `https://${normalizedDomain}`;
    }

    return getRootUrl();
  })();
  const sellerLoginUrl = store.slug
    ? `${adminOrigin}/admin/${store.slug}/login`
    : `${adminOrigin}/admin/login`;

  return (
    <section className="relative min-h-[80vh] sm:min-h-[90vh] w-full overflow-hidden bg-[#f2f2f2]">
      {/* Background media */}
      <div className="absolute inset-0 z-0">
        {isVideo ? (
          <DeferredHeroVideo
            src={mediaUrl}
            className="w-full h-full object-cover"
            fallbackPoster={fallbackPoster}
          />
        ) : (
          shouldUseNativeImg ? (
            <Image
              src={mediaUrl}
              alt={`${store.name} hero`}
              fill
              priority
              className="object-cover bg-neutral-100"
              sizes="100vw"
              unoptimized
            />
          ) : (
            <Image
              src={mediaUrl}
              alt={`${store.name} hero`}
              fill
              priority
              className="object-cover bg-neutral-100"
              sizes="100vw"
              unoptimized={isUploadThingBlobUrl(mediaUrl)}
            />
          )
        )}
        <div className="absolute inset-0 z-10 bg-linear-to-b from-black/30 via-black/10 to-transparent" aria-hidden />
      </div>

      <div className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center px-4 sm:h-[80px] sm:px-6 lg:px-10">
          <div className="flex w-full items-center gap-3 sm:gap-4 md:gap-6">
            <Link
              href={store.slug ? `/${store.slug}` : "/"}
              className={`${bricolage.className} shrink-0 text-xl font-semibold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-all hover:opacity-80 sm:text-2xl`}
            >
              {store.name}
            </Link>

            <div className="flex-1" />

            <div className="hidden items-center gap-1 sm:gap-2 md:flex">
              <button
                type="button"
                onClick={() => {
                  if (sellerLoginUrl.startsWith("http")) {
                    window.location.href = sellerLoginUrl;
                    return;
                  }
                }}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                Admin
              </button>

              <div className="mx-1 h-5 w-px bg-white/20" />

              <Link
                href={store.slug ? `/${store.slug}/wishlist` : "/wishlist"}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                aria-label="Liked Items"
              >
                <HugeiconsIcon icon={FavouriteIcon} size={20} className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                <Badge count={wishlistCount} />
              </Link>

              <Link
                href={store.slug ? `/${store.slug}/cart` : "/cart"}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                aria-label="Cart"
              >
                <HugeiconsIcon icon={ShoppingBag01Icon} size={20} className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                <Badge count={storeItemCount} />
              </Link>
            </div>

            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                      aria-label="Open menu"
                    >
                      <HugeiconsIcon icon={Menu01Icon} size={20} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                      <Badge count={totalCount} />
                    </button>
                  }
                >
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="z-50 flex w-64 flex-col gap-1 rounded-2xl border border-black/8 bg-white p-2 text-neutral-900 shadow-2xl"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      window.location.href = store.slug ? `/${store.slug}/cart` : "/cart"
                    }}
                    className="cursor-pointer flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 outline-none hover:bg-neutral-100 focus:bg-neutral-100"
                  >
                    <span className="flex items-center gap-3">
                      <HugeiconsIcon icon={ShoppingBag01Icon} size={18} />
                      <span>Cart</span>
                    </span>
                    {storeItemCount > 0 ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{storeItemCount}</span> : null}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      window.location.href = store.slug ? `/${store.slug}/wishlist` : "/wishlist"
                    }}
                    className="cursor-pointer flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 outline-none hover:bg-neutral-100 focus:bg-neutral-100"
                  >
                    <span className="flex items-center gap-3">
                      <HugeiconsIcon icon={FavouriteIcon} size={18} />
                      <span>Liked Items</span>
                    </span>
                    {wishlistCount > 0 ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white">{wishlistCount}</span> : null}
                  </DropdownMenuItem>

                  <div className="my-1 border-t border-black/5" />

                  <DropdownMenuItem
                    onClick={() => {
                      if (sellerLoginUrl.startsWith("http")) {
                        window.location.href = sellerLoginUrl;
                      }
                    }}
                    className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 outline-none hover:bg-neutral-100 focus:bg-neutral-100"
                  >
                    Sign in to admin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20">
        <div className="min-h-[60vh] sm:min-h-[70vh] flex items-end justify-end">
          <div className="flex flex-col gap-6 sm:gap-8 pb-6 sm:pb-8 text-right max-w-lg">
            <p className="text-sm sm:text-base text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] leading-relaxed">
              {heroDescription}
            </p>
            <div className="flex w-full sm:w-auto justify-end">
              <HeroScrollCta
                targetId="storefront-main-content"
                className="px-6 sm:px-8 h-11 bg-white text-neutral-900 text-sm font-semibold tracking-wide rounded-full shadow-md hover:bg-white/90"
              >
                Shop Now
              </HeroScrollCta>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
