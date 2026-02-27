"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
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
    const storeSlug = params?.s as string;
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

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-white">
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />
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
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-2 mb-10">
                        <Link href={`/${storeSlug || ""}`} className="p-2 -ml-2 hover:bg-neutral-100 transition-colors">
                            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                        </Link>
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
                            <Button className="h-14 rounded-none px-8 uppercase text-xs tracking-widest font-semibold transition-colors">
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4 border-b border-neutral-200 pb-6 mb-8">
                    <Link href={`/${storeSlug || ""}`} className="p-2 -ml-2 text-neutral-400 hover:text-neutral-900 transition-colors">
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-6 w-6" />
                    </Link>
                    <h1 className={`${geistSans.className} text-2xl uppercase tracking-widest font-semibold`}>Shopping Bag</h1>
                    <span className="text-sm font-medium text-neutral-500 uppercase tracking-widest ml-auto">
                        {storeItems.length} {storeItems.length === 1 ? 'Item' : 'Items'}
                    </span>
                </div>

                <div className="grid lg:grid-cols-[1fr_320px] gap-12">
                    {/* Items List */}
                    <div className="divide-y divide-neutral-200 border-b border-neutral-200">
                        {storeItems.map((item) => (
                            <div key={item.id} className="py-8 flex gap-6">
                                <Link
                                    href={`/${item.product.id}/${item.product.slug}`}
                                    className="relative w-28 aspect-3/4 bg-neutral-100 shrink-0 block overflow-hidden"
                                >
                                    {item.product.contentType?.startsWith("video/") || item.product.image?.match(/\.(mp4|webm|mov|ogg)$/i) || ((item.product.image || "").includes(".ufs.sh") && !(item.product.image || "").match(/\.(jpg|jpeg|png|webp|gif)$/i) && !item.product.contentType?.startsWith("image/")) ? (
                                        <video
                                            src={item.product.image || ""}
                                            className="h-full w-full object-cover mix-blend-multiply"
                                            muted
                                            playsInline
                                            loop
                                            autoPlay
                                        />
                                    ) : (
                                        <Image
                                            src={item.product.image || FALLBACK_PRODUCT_IMAGE}
                                            alt={item.product.name}
                                            fill
                                            sizes="120px"
                                            className="object-cover mix-blend-multiply"
                                            unoptimized={(item.product.image || "").includes(".ufs.sh")}
                                        />
                                    )}
                                </Link>

                                <div className="flex-1 flex flex-col pt-1">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="font-serif text-lg leading-tight mb-1">
                                                <Link href={`/${item.product.id}/${item.product.slug}`} className="hover:underline">
                                                    {item.product.name}
                                                </Link>
                                            </h3>
                                            {/* Size variant placeholder */}
                                            <p className="text-xs uppercase tracking-widest text-neutral-500 mt-2">
                                                Standard
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-medium">
                                                {item.product.currency} {item.product.price.toLocaleString(undefined, { minimumFractionDigits: item.product.currency === "USD" ? 2 : 0, maximumFractionDigits: item.product.currency === "USD" ? 2 : 0 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between mt-auto">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs uppercase tracking-widest text-neutral-500">Qty</span>
                                            <div className="flex items-center border border-neutral-300 h-10 w-24">
                                                <button
                                                    onClick={() => {
                                                        if (item.quantity <= 1) {
                                                            removeItem(item.id);
                                                        } else {
                                                            updateQuantity(item.id, item.quantity - 1);
                                                        }
                                                    }}
                                                    className="w-8 h-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                                                >
                                                    {item.quantity <= 1 ? <HugeiconsIcon icon={Delete02Icon} size={14} /> : <HugeiconsIcon icon={MinusSignIcon} size={14} />}
                                                </button>
                                                <span className="flex-1 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-8 h-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                                                >
                                                    <HugeiconsIcon icon={PlusSignIcon} size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-4"
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
                    <div className="lg:pl-8 lg:border-l lg:border-neutral-200 flex flex-col">
                        <h2 className={`${geistSans.className} text-sm uppercase tracking-widest font-semibold mb-6`}>Order Summary</h2>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Subtotal</span>
                                <span className="font-medium">{currency} {storeSubtotal.toLocaleString(undefined, { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Shipping</span>
                                <span className="text-neutral-500">Calculated at checkout</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end border-t border-neutral-200 pt-6 mb-8">
                            <span className={`${geistSans.className} uppercase tracking-widest font-semibold`}>Total</span>
                            <div className="text-right">
                                <span className="block text-xl font-medium">{currency} {storeSubtotal.toLocaleString(undefined, { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 })}</span>
                                <span className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">VAT Included</span>
                            </div>
                        </div>

                        <Link href={`/${storeSlug || ""}/checkout?storeId=${storeId}`} className="mt-auto">
                            <Button className="w-full h-14 rounded-none uppercase text-xs tracking-widest font-semibold transition-colors">
                                Secure Checkout
                            </Button>
                        </Link>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-neutral-500">Taxes and shipping calculated at checkout.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
