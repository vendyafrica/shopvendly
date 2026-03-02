"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { Bricolage_Grotesque } from "next/font/google";

const geistSans = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

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
        <div className="rounded-2xl border border-neutral-200 bg-white/90 shadow-sm p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-neutral-200">
            <button
              onClick={handleBack}
              className="p-2 -ml-1 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
            </button>
            <h1
              className={`${geistSans.className} text-xl sm:text-2xl uppercase tracking-widest font-semibold`}
            >
              Wishlist
            </h1>
            <span className="text-xs sm:text-sm font-semibold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-3 py-1 rounded-full ml-auto">
              {storeItems.length} {storeItems.length === 1 ? "Item" : "Items"}
            </span>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
            {/* Items List */}
            <div className="space-y-4">
              {storeItems.map((item) => {
                const href = item.slug
                  ? `/${storeSlug}/${item.slug}`
                  : `/${storeSlug}`;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6"
                  >
                    <Link
                      href={href}
                      className="relative w-full sm:w-28 aspect-3/4 bg-white rounded-xl overflow-hidden shadow-sm"
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
                          autoPlay
                        />
                      ) : (
                        <Image
                          src={item.image || FALLBACK_PRODUCT_IMAGE}
                          alt={item.name}
                          fill
                          sizes="160px"
                          className="object-cover"
                          unoptimized={item.image?.includes(".ufs.sh")}
                        />
                      )}
                    </Link>

                    <div className="flex-1 flex flex-col gap-4">
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

                      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mt-auto">
                        <Link href={href} className="w-full sm:w-auto">
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto h-12 rounded-md uppercase text-xs tracking-widest font-semibold transition-colors"
                          >
                            View Product
                          </Button>
                        </Link>

                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="text-xs uppercase tracking-widest text-neutral-400 hover:text-red-600 transition-colors underline underline-offset-4 self-end"
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
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 sm:p-6 flex flex-col shadow-sm">
              <h2
                className={`${geistSans.className} text-sm uppercase tracking-widest font-semibold mb-5`}
              >
                Wishlist Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Total Items</span>
                  <span className="font-semibold text-neutral-900">
                    {storeItems.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Total Value</span>
                  <span className="font-semibold text-neutral-900">
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

              <div className="border-t border-neutral-200 pt-5 mb-6">
                <p className="text-xs text-neutral-500 text-center">
                  Keep track of items you love and purchase them later.
                </p>
              </div>

              <Link href={`/${storeSlug}`} className="mt-auto">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-md uppercase text-xs tracking-widest font-semibold transition-colors"
                >
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
