"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, MinusSignIcon, PlusSignIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { useCart } from "@/features/cart/context/cart-context";
import { Bricolage_Grotesque } from "next/font/google";

const geistSans = Bricolage_Grotesque({
    variable: "--font-bricolage-grotesque",
    subsets: ["latin"],
});

export default function StoreCartPage() {
    const params = useParams();
    const router = useRouter();
    const storeSlug = (params?.handle as string) || (params?.s as string);
    const { itemsByStore, updateQuantity, removeItem, isLoaded } = useCart();

    const storeId = useMemo(() => {
        if (!isLoaded) return null;

        for (const [id, items] of Object.entries(itemsByStore)) {
            if (items[0]?.store?.slug === storeSlug) {
                return id;
            }
        }

        return null;
    }, [isLoaded, itemsByStore, storeSlug]);

    const handleBack = () => {
        router.push(`/${storeSlug || ""}`);
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-white pt-24 pb-24">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24 space-y-6">
                    <div className="h-6 w-40 bg-neutral-100 rounded-full animate-pulse" />
                    <div className="grid lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, idx) => (
                                <div key={idx} className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5 flex gap-4 animate-pulse">
                                    <div className="w-24 sm:w-28 aspect-3/4 rounded-xl bg-neutral-200" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 w-1/2 bg-neutral-200 rounded" />
                                        <div className="h-3 w-24 bg-neutral-200 rounded" />
                                        <div className="h-3 w-32 bg-neutral-200 rounded" />
                                        <div className="flex items-center justify-between pt-4">
                                            <div className="h-10 w-24 bg-neutral-200 rounded" />
                                            <div className="h-3 w-12 bg-neutral-200 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 animate-pulse space-y-4">
                            <div className="h-4 w-24 bg-neutral-200 rounded" />
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="h-3 w-16 bg-neutral-200 rounded" />
                                    <span className="h-3 w-20 bg-neutral-200 rounded" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="h-3 w-16 bg-neutral-200 rounded" />
                                    <span className="h-3 w-24 bg-neutral-200 rounded" />
                                </div>
                            </div>
                            <div className="h-12 w-full bg-neutral-200 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const FALLBACK_PRODUCT_IMAGE = "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg";

    const storeItems = storeId ? (itemsByStore[storeId] || []) : [];
    const storeSubtotal = storeItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const currency = storeItems[0]?.product.currency || "UGX";

    if (storeItems.length === 0) {
        return (
            <div className="min-h-screen bg-white pt-24">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24 py-8">
                    <div className="flex items-center gap-2 mb-10">
                        <button onClick={handleBack} className="p-2 -ml-2 hover:bg-neutral-100 transition-colors">
                            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                        </button>
                        <h1 className={`${geistSans.className} text-xl uppercase tracking-widest font-semibold`}>Shopping Bag</h1>
                    </div>

                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="mb-6">
                            <HugeiconsIcon icon={Delete02Icon} size={48} className="text-neutral-200 stroke-[1.5]" />
                        </div>
                        <h2 className={`${geistSans.className} text-xl uppercase tracking-widest font-semibold mb-2`}>Your bag is empty</h2>
                        <p className="text-neutral-500 mb-8 max-w-sm">
                            Looks like you haven&apos;t added anything from this store to your bag yet.
                        </p>
                        <Link href={`/${storeSlug || ""}`}>
                            <Button className="h-12 rounded-none px-8 uppercase text-xs tracking-widest font-semibold transition-colors">
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
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
                <div className="rounded-2xl border border-neutral-200 bg-white/90 shadow-sm p-4 sm:p-6 lg:p-8 space-y-8">
                    <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-neutral-200">
                        <button onClick={handleBack} className="p-2 -ml-1 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
                            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                        </button>
                        <h1 className={`${geistSans.className} text-xl sm:text-2xl uppercase tracking-widest font-semibold`}>Shopping Bag</h1>
                        <span className="text-xs sm:text-sm font-semibold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-3 py-1 rounded-full ml-auto">
                            {storeItems.length} {storeItems.length === 1 ? 'Item' : 'Items'}
                        </span>
                    </div>

                    <div className="grid lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
                        {/* Items List */}
                        <div className="space-y-4">
                            {storeItems.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    <Link
                                        href={`/${storeSlug || item.store.slug}/${item.product.slug}`}
                                        className="relative w-full sm:w-28 aspect-3/4 bg-white rounded-xl overflow-hidden shadow-sm"
                                    >
                                        {item.product.contentType?.startsWith("video/") || item.product.image?.match(/\.(mp4|webm|mov|ogg)$/i) || ((item.product.image || "").includes(".ufs.sh") && !(item.product.image || "").match(/\.(jpg|jpeg|png|webp|gif)$/i) && !item.product.contentType?.startsWith("image/")) ? (
                                            <video
                                                src={item.product.image || ""}
                                                className="h-full w-full object-cover bg-neutral-100"
                                                muted
                                                playsInline
                                                loop
                                                autoPlay
                                                preload="none"
                                            />
                                        ) : (
                                            <Image
                                                src={item.product.image || FALLBACK_PRODUCT_IMAGE}
                                                alt={item.product.name}
                                                fill
                                                sizes="160px"
                                                className="object-cover bg-neutral-100"
                                                unoptimized={(item.product.image || "").includes(".ufs.sh")}
                                            />
                                        )}
                                    </Link>

                                    <div className="flex-1 flex flex-col gap-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div className="space-y-2">
                                                <h3 className="font-serif text-lg leading-tight">
                                                    <Link href={`/${storeSlug || item.store.slug}/${item.product.slug}`} className="hover:underline">
                                                        {item.product.name ? `${item.product.name.charAt(0).toUpperCase()}${item.product.name.slice(1)}` : item.product.name}
                                                    </Link>
                                                </h3>
                                                <p className="text-xs uppercase tracking-widest text-neutral-500">Standard</p>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <span className="font-semibold text-neutral-900">
                                                    {item.product.currency} {item.product.price.toLocaleString(undefined, { minimumFractionDigits: item.product.currency === "USD" ? 2 : 0, maximumFractionDigits: item.product.currency === "USD" ? 2 : 0 })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mt-auto">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs uppercase tracking-widest text-neutral-500">Qty</span>
                                                <div className="flex items-center border border-neutral-300 rounded-lg h-11 w-28 bg-white shadow-sm">
                                                    <button
                                                        onClick={() => {
                                                            if (item.quantity <= 1) {
                                                                removeItem(item.id);
                                                            } else {
                                                                updateQuantity(item.id, item.quantity - 1);
                                                            }
                                                        }}
                                                        className="w-9 h-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                                                    >
                                                        <HugeiconsIcon icon={item.quantity <= 1 ? Delete02Icon : MinusSignIcon} size={14} className="text-neutral-500 hover:text-red-600 transition-colors" />
                                                    </button>
                                                    <span className="flex-1 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-9 h-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                                                    >
                                                        <HugeiconsIcon icon={PlusSignIcon} size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-xs tracking-widest text-neutral-400 hover:text-red-600 transition-colors underline underline-offset-4 self-end"
                                                aria-label="Remove item"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 sm:p-6 flex flex-col shadow-sm">
                            <h2 className={`${geistSans.className} text-sm uppercase tracking-widest font-semibold mb-5`}>Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-600">Subtotal</span>
                                    <span className="font-semibold text-neutral-900">{currency} {storeSubtotal.toLocaleString(undefined, { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-600">Shipping</span>
                                    <span className="text-neutral-500">Calculated at checkout</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-t border-neutral-200 pt-5 mb-6">
                                <span className={`${geistSans.className} uppercase tracking-widest font-semibold`}>Total</span>
                                <div className="text-right">
                                    <span className="block text-xl font-semibold text-neutral-900">{currency} {storeSubtotal.toLocaleString(undefined, { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 })}</span>
                                </div>
                            </div>

                            <Link href={`/${storeSlug || ""}/checkout?storeId=${storeId}`} className="mt-auto">
                                <Button className="w-full h-12 rounded-md uppercase text-xs tracking-widest font-semibold transition-colors">
                                    Continue to Checkout
                                </Button>
                            </Link>

                            <div className="mt-4 text-center">
                                <p className="text-xs text-neutral-500">Shipping calculated at checkout.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
