"use client";

import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, MinusSignIcon, PlusSignIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { useCart } from "../../../contexts/cart-context";
import { StoreAvatar } from "@/components/store-avatar";
import Header from "../components/header";
import Footer from "../components/footer";
import RecentlyViewed from "../components/recently-viewed";
import { Bricolage_Grotesque } from "next/font/google";
import { getStorefrontUrl } from "@/utils/misc";

const geistSans = Bricolage_Grotesque({
    variable: "--font-bricolage-grotesque",
    subsets: ["latin"],
});


export default function CartPage() {
    const { itemsByStore, updateQuantity, removeItem, itemCount, isLoaded } = useCart();

    // Check if loaded first
    if (!isLoaded) {
        return (
            <main className="min-h-screen">
                <Header hideSearch />
                <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800" />
                </div>
            </main>
        );
    }

    const FALLBACK_PRODUCT_IMAGE = "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg";

    if (itemCount === 0) {
        return (
            <main className="min-h-screen">
                <Header hideSearch />

                <div className="max-w-3xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Link href="/" className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors">
                            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                        </Link>
                        <h1 className="text-xl font-semibold">Shopping Bag</h1>
                    </div>

                    <div className="bg-white rounded-3xl border border-neutral-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="bg-neutral-50 p-6 rounded-full mb-6">
                            <HugeiconsIcon icon={Delete02Icon} className="h-10 w-10 text-neutral-300" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                        <p className="text-neutral-500 mb-8">
                            Looks like you have not added anything to your cart yet.
                        </p>
                        <Link href="/">
                            <Button size="lg" className="rounded-full px-8 h-12">
                                Start Shopping
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-12">
                        <RecentlyViewed />
                    </div>
                </div>

                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <Header hideSearch />

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <Link href="/" className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold">Shopping Bag</h1>
                </div>

                <div className="space-y-6">
                    {Object.entries(itemsByStore).map(([storeId, storeItems]) => {
                        const store = storeItems[0].store;
                        const storeSubtotal = storeItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
                        const currency = storeItems[0]?.product.currency || "KES";

                        return (
                            <div key={storeId} className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
                                <div className="p-6 pb-4 flex items-center justify-between border-b border-neutral-50">
                                    <div className="flex items-center gap-3">
                                        <StoreAvatar
                                            storeName={store.name}
                                            logoUrl={store.logoUrl}
                                            size="md"
                                            className="border border-neutral-100"
                                        />
                                        <div>
                                            <Link href={getStorefrontUrl(store.slug)}>
                                                <h2 className={`${geistSans.className} font-semibold text-base hover:text-primary transition-colors capitalize`}>{store.name}</h2>
                                            </Link>
                                            <p className="text-xs text-neutral-500">{storeItems.length} items</p>
                                        </div>
                                    </div>

                                    {/* Optional: Store actions dropdown could go here */}
                                </div>

                                <div className="divide-y divide-neutral-100">
                                    {storeItems.map((item) => (
                                        <div key={item.id} className="p-6 flex gap-5">
                                            <div className="relative h-24 w-24 bg-neutral-50 rounded-xl overflow-hidden shrink-0 border border-neutral-100">
                                                {item.product.contentType?.startsWith("video/") || item.product.image?.match(/\.(mp4|webm|mov|ogg)$/i) || ((item.product.image || "").includes(".ufs.sh") && !(item.product.image || "").match(/\.(jpg|jpeg|png|webp|gif)$/i) && !item.product.contentType?.startsWith("image/")) ? (
                                                    <video
                                                        src={item.product.image || ""}
                                                        className="h-full w-full object-cover"
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
                                                        className="object-cover"
                                                        unoptimized={(item.product.image || "").includes(".ufs.sh")}
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1 flex flex-col justify-between py-0.5">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <h3 className="font-medium text-base mb-1">
                                                            <Link href={getStorefrontUrl(store.slug, `/${item.product.id}/${item.product.slug}`)} className="hover:underline">
                                                                {item.product.name}
                                                            </Link>
                                                        </h3>
                                                        <p className="text-sm text-neutral-500">
                                                            {/* Variant placeholder if needed */}
                                                            Standard
                                                        </p>
                                                    </div>
                                                    <div className="font-semibold text-base">
                                                        {item.product.currency} {item.product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="flex items-center border border-neutral-200 rounded-full bg-white h-9 shadow-sm/50">
                                                        <button
                                                            onClick={() => {
                                                                if (item.quantity <= 1) {
                                                                    removeItem(item.id);
                                                                } else {
                                                                    updateQuantity(item.id, item.quantity - 1);
                                                                }
                                                            }}
                                                            className="w-9 h-full flex items-center justify-center hover:bg-neutral-50 rounded-l-full text-neutral-600 transition-colors"
                                                        >
                                                            {item.quantity <= 1 ? <HugeiconsIcon icon={Delete02Icon} size={14} /> : <HugeiconsIcon icon={MinusSignIcon} size={14} />}
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="w-9 h-full flex items-center justify-center hover:bg-neutral-50 rounded-r-full text-neutral-600 transition-colors"
                                                        >
                                                            <HugeiconsIcon icon={PlusSignIcon} size={14} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-neutral-400 hover:text-red-500 transition-colors p-2"
                                                        aria-label="Remove item"
                                                    >
                                                        <HugeiconsIcon icon={Delete02Icon} size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 bg-neutral-50/50 border-t border-neutral-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-neutral-600">Subtotal</span>
                                        <span className="text-lg font-bold">
                                            {currency} {storeSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <Link href={`/checkout?storeId=${store.id}`}>
                                        <Button className="w-full h-12 text-base font-semibold rounded-full transition-all">
                                            Continue to checkout
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 pt-6 border-t border-neutral-200">
                    <RecentlyViewed />
                </div>
            </div>

            <Footer />
        </main>
    );
}
