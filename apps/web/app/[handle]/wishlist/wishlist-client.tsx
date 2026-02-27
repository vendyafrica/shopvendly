"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { useWishlist } from "@/hooks/use-wishlist";

export default function WishlistClient() {
    const params = useParams();
    const storeSlug = params?.s as string;
    const { items, removeFromWishlist } = useWishlist();

    const storeItems = items.filter(item => item.store?.slug === storeSlug);

    const FALLBACK_PRODUCT_IMAGE = "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg";

    const formatPrice = (amount: number | undefined, currency: string | undefined) => {
        if (amount === undefined || amount === null || Number.isNaN(amount)) return "—";
        const c = currency || "";
        return `${c} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`.trim();
    };

    if (storeItems.length === 0) {
        return (
            <main className="min-h-screen bg-white pt-24">
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-2 mb-10">
                        <Link href="/" className="p-2 -ml-2 text-neutral-400 hover:text-neutral-900 transition-colors">
                            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                        </Link>
                        <h1 className="text-xl uppercase tracking-widest font-semibold">Wishlist</h1>
                    </div>

                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="mb-6">
                            <HugeiconsIcon icon={Delete02Icon} size={48} className="text-neutral-200 stroke-[1.5]" />
                        </div>
                        <h2 className="text-xl uppercase tracking-widest font-semibold mb-2">No saved items</h2>
                        <p className="text-neutral-500 mb-8 max-w-sm">
                            Tap the heart on a product to save it here for later.
                        </p>
                        <Link href="/">
                            <Button className="h-14 rounded-none px-8 bg-neutral-900 text-white hover:bg-black uppercase text-xs tracking-widest font-semibold transition-colors">
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white pt-24 pb-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4 border-b border-neutral-200 pb-6 mb-8">
                    <Link href="/" className="p-2 -ml-2 text-neutral-400 hover:text-neutral-900 transition-colors">
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-6 w-6" />
                    </Link>
                    <h1 className="text-2xl uppercase tracking-widest font-semibold">Wishlist</h1>
                    <span className="text-sm font-medium text-neutral-500 uppercase tracking-widest ml-auto">
                        {storeItems.length} {storeItems.length === 1 ? 'Item' : 'Items'}
                    </span>
                </div>

                <div className="space-y-4">
                    {storeItems.map((item) => {
                        const href = item.slug ? `/${item.id}/${item.slug}` : `/`;
                        return (
                            <div
                                key={item.id}
                                className="bg-white border-b border-neutral-200 transition-all duration-200"
                            >
                                <div className="py-6 flex gap-6 items-start">
                                    <Link href={href} className="relative w-24 aspect-3/4 bg-neutral-100 shrink-0 block overflow-hidden">
                                        {item.contentType?.startsWith("video/") || item.image?.match(/\.(mp4|webm|mov|ogg)$/i) || ((item.image || "").includes(".ufs.sh") && !(item.image || "").match(/\.(jpg|jpeg|png|webp|gif)$/i) && !item.contentType?.startsWith("image/")) ? (
                                            <video
                                                src={item.image || ""}
                                                className="h-full w-full object-cover mix-blend-multiply"
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
                                                className="object-cover mix-blend-multiply"
                                                sizes="120px"
                                                unoptimized={item.image?.includes(".ufs.sh")}
                                            />
                                        )}
                                    </Link>

                                    <div className="flex-1 flex flex-col justify-between self-stretch py-0.5">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <h3 className="font-serif text-lg leading-tight">
                                                    <Link href={href} className="hover:underline">
                                                        {item.name}
                                                    </Link>
                                                </h3>
                                                {item.store?.name && (
                                                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">{item.store.name}</p>
                                                )}
                                            </div>
                                            <div className="text-right mt-0.5">
                                                <span className="font-medium text-sm">
                                                    {formatPrice(item.price, item.currency)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto gap-4">
                                            <Link href={href} className="w-full sm:w-auto">
                                                <Button className="w-full sm:w-auto h-12 rounded-none px-8 border border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-900 hover:text-white uppercase text-xs tracking-widest font-semibold transition-colors">
                                                    View product
                                                </Button>
                                            </Link>
                                            <button
                                                onClick={() => removeFromWishlist(item.id)}
                                                className="text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-4"
                                                aria-label="Remove from wishlist"
                                            >
                                                Remove
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
