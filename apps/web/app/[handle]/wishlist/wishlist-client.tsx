"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { bricolage as geistSans } from "@/utils/fonts";

export default function WishlistClient() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.handle as string) || (params?.s as string) || "";
  const { items, removeFromWishlist } = useWishlist();

  const storeItems = items.filter((item) => item.store?.slug === storeSlug);

  const handleBack = () => {
    router.push(`/${storeSlug}`);
  };

  const FALLBACK_PRODUCT_IMAGE =
    "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg";

  const formatPrice = (
    amount: number | undefined,
    currency: string | undefined,
  ) => {
    if (amount === undefined || amount === null || Number.isNaN(amount))
      return "—";
    const c = currency || "";
    return `${c} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`.trim();
  };

  if (storeItems.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-10">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-neutral-100 transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
            </button>
            <h1
              className={`${geistSans.className} text-xl uppercase tracking-widest font-semibold`}
            >
              Wishlist
            </h1>
          </div>

          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="mb-6">
              <HugeiconsIcon
                icon={Delete02Icon}
                size={48}
                className="text-neutral-200 stroke-[1.5]"
              />
            </div>
            <h2
              className={`${geistSans.className} text-xl uppercase tracking-widest font-semibold mb-2`}
            >
              Your wishlist is empty
            </h2>
            <p className="text-neutral-500 mb-8 max-w-sm">
              Tap the heart on a product to save it here for later.
            </p>
            <Link href={`/${storeSlug}`}>
              <Button className="h-12 rounded-md px-8 uppercase text-xs tracking-widest font-semibold transition-colors">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
            </button>
            <h1
              className={`${geistSans.className} text-xl sm:text-2xl uppercase tracking-widest font-semibold`}
            >
              Wishlist
            </h1>
            <span className="text-xs sm:text-sm font-semibold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-3 py-1.5 rounded-full ml-auto">
              {storeItems.length} {storeItems.length === 1 ? "Item" : "Items"}
            </span>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">
            {/* Items List */}
            <div className="space-y-0">
              {storeItems.map((item, index) => {
                const href = item.slug
                  ? `/${storeSlug}/${item.slug}`
                  : `/${storeSlug}`;
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row gap-5 sm:gap-6 py-6 ${index !== storeItems.length - 1 ? "border-b border-neutral-100" : ""}`}
                  >
                    <Link
                      href={href}
                      className="relative w-24 sm:w-32 aspect-3/4 bg-neutral-100 rounded-lg overflow-hidden shrink-0"
                    >
                      {item.contentType?.startsWith("video/") ||
                        item.image?.match(/\.(mp4|webm|mov|ogg)$/i) ||
                        ((item.image || "").includes(".ufs.sh") &&
                          !(item.image || "").match(
                            /\.(jpg|jpeg|png|webp|gif)$/i,
                          ) &&
                          !item.contentType?.startsWith("image/")) ? (
                        <video
                          src={item.image || ""}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          loop
                          preload="metadata"
                        />
                      ) : (
                        <Image
                          src={item.image || FALLBACK_PRODUCT_IMAGE}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 96px, 128px"
                          className="object-cover"
                          unoptimized={item.image?.includes(".ufs.sh")}
                        />
                      )}
                    </Link>

                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-2">
                          <h3 className="font-serif text-lg leading-tight">
                            <Link href={href} className="hover:underline">
                              {item.name
                                ? `${item.name.charAt(0).toUpperCase()}${item.name.slice(1)}`
                                : item.name}
                            </Link>
                          </h3>
                          <p className="text-xs uppercase tracking-widest text-neutral-500">
                            Saved Item
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="font-semibold text-neutral-900">
                            {formatPrice(item.price, item.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-auto">
                        <Link href={href}>
                          <Button
                            variant="outline"
                            className="h-10 rounded-md px-5 text-xs font-semibold"
                          >
                            View
                          </Button>
                        </Link>

                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="text-xs font-medium text-neutral-400 hover:text-red-600 transition-colors underline underline-offset-4"
                          aria-label="Remove from wishlist"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Wishlist Summary */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl bg-neutral-50 p-6 sm:p-8 flex flex-col">
                <h2
                  className={`${geistSans.className} text-base uppercase tracking-widest font-semibold mb-6`}
                >
                  Summary
                </h2>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500 font-medium tracking-wide">Total Items</span>
                    <span className="font-semibold text-neutral-900">
                      {storeItems.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500 font-medium tracking-wide">Total Value</span>
                    <span className="font-semibold text-neutral-900 text-base">
                      {storeItems.reduce(
                        (sum, item) => sum + (item.price || 0),
                        0,
                      ) > 0
                        ? formatPrice(
                          storeItems.reduce(
                            (sum, item) => sum + (item.price || 0),
                            0,
                          ),
                          storeItems[0]?.currency,
                        )
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-neutral-200/50 pt-6 mb-8">
                  <p className="text-[13px] leading-relaxed text-neutral-500">
                    Keep track of items you love and purchase them later when you are ready.
                  </p>
                </div>

                <Link href={`/${storeSlug}`} className="mt-auto w-full">
                  <Button
                    className="w-full h-12 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
