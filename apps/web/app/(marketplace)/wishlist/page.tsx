"use client";

import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { useWishlist } from "@/hooks/use-wishlist";

const FALLBACK_PRODUCT_IMAGE = "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg";

const formatPrice = (amount: number | undefined, currency: string | undefined) => {
    if (amount === undefined || amount === null || Number.isNaN(amount)) return "—";
    const c = currency || "";
    const showDecimals = c === "USD";
    return `${c} ${amount.toLocaleString(undefined, {
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
    })}`.trim();
};

export default function WishlistAllPage() {
    const { items, removeFromWishlist } = useWishlist();

    if (items.length === 0) {
        return (
            <main className="min-h-screen">
                <div className="max-w-3xl mx-auto px-4 py-12">
                    <div className="flex items-center gap-2 mb-6">
                        <Link href="/" className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors">
                            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                        </Link>
                        <h1 className="text-xl font-semibold">Wishlist</h1>
                    </div>

                    <div className="bg-white rounded-3xl border border-neutral-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="bg-neutral-50 p-6 rounded-full mb-6">
                            <HugeiconsIcon icon={Delete02Icon} className="h-10 w-10 text-neutral-300" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No saved items</h2>
                        <p className="text-neutral-500 mb-8">
                            Tap the heart on a product to save it here for later.
                        </p>
                        <Link href="/">
                            <Button size="lg" className="rounded-full px-8 h-12">
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-10 space-y-6">
                <div className="flex items-center gap-2 mb-1">
                    <Link href="/" className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-semibold">Wishlist</h1>
                    <span className="ml-2 text-sm text-neutral-500">{items.length} item{items.length === 1 ? "" : "s"}</span>
                </div>
                <p className="text-sm text-neutral-500">Saved products across all stores</p>

                <div className="space-y-4">
                    {items.map((item) => {
                        const href = item.slug && item.store?.slug ? `/${item.store.slug}/products/${item.slug}` : "/";
                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-neutral-200 shadow-sm transition-all duration-200 hover:shadow-md"
                            >
                                <div className="p-5 flex gap-5 items-start">
                                    <div className="relative h-24 w-24 bg-neutral-50 rounded-2xl overflow-hidden shrink-0 border border-neutral-100">
                                        {item.contentType?.startsWith("video/") || item.image?.match(/\.(mp4|webm|mov|ogg)$/i) || ((item.image || "").includes(".ufs.sh") && !(item.image || "").match(/\.(jpg|jpeg|png|webp|gif)$/i) && !item.contentType?.startsWith("image/")) ? (
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
                                                className="object-cover"
                                                sizes="120px"
                                                unoptimized={item.image?.includes(".ufs.sh")}
                                            />
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-base leading-snug">
                                                    <Link href={href} className="hover:underline">
                                                        {item.name}
                                                    </Link>
                                                </h3>
                                                {item.store?.name && (
                                                    <p className="text-xs text-neutral-500">{item.store.name}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                                                    {formatPrice(item.price, item.currency)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 gap-3">
                                            <Link href={href} className="flex-1">
                                                <Button variant="outline" className="w-full h-10 rounded-full text-sm font-medium">
                                                    View product
                                                </Button>
                                            </Link>
                                            <button
                                                onClick={() => removeFromWishlist(item.id)}
                                                className="ml-1 text-neutral-400 hover:text-red-500 transition-colors p-2"
                                                aria-label="Remove from wishlist"
                                            >
                                                <HugeiconsIcon icon={Delete02Icon} size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
