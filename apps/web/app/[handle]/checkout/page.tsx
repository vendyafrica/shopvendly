"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Loading03Icon,
    CheckmarkCircle02Icon,
    ArrowRight01Icon,
    ArrowLeft01Icon
} from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { useCart } from "@/features/cart/context/cart-context";
import { useAppSession } from "@/contexts/app-session-context";
import { Bricolage_Grotesque } from "next/font/google";

const geistSans = Bricolage_Grotesque({
    variable: "--font-bricolage-grotesque",
    subsets: ["latin"],
});

const API_BASE = "";

const capitalizeFirst = (value?: string | null) => {
    if (!value) return value;
    const trimmed = value.trim();
    if (!trimmed) return value;
    return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
};

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const storeSlug = (params?.handle as string) || (params?.s as string);

    const storeId = searchParams.get("storeId");
    const { itemsByStore, clearStoreFromCart, isLoaded } = useCart();
    const { session } = useAppSession();

    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const paymentMethod = "relworx";

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isAwaitingPayment, setIsAwaitingPayment] = useState(false);
    const [paymentInternalReference, setPaymentInternalReference] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user) {
            setEmail(session.user.email || "");
            setFullName(session.user.name || "");
        }
    }, [session]);

    const storeItems = storeId ? itemsByStore[storeId] : [];
    const store = storeItems?.[0]?.store;

    useEffect(() => {
        if (!isLoaded) return;
        if (!storeId || !store) {
            router.push(`/${storeSlug || ""}/cart`);
        }
    }, [isLoaded, storeId, store, storeSlug, router]);

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-white pt-20 pb-24">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
                    <div className="rounded-2xl border border-neutral-200 bg-white/90 shadow-sm p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
                        <div className="h-5 w-32 bg-neutral-100 rounded" />
                        <div className="grid lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
                            <div className="space-y-4">
                                {Array.from({ length: 2 }).map((_, idx) => (
                                    <div key={idx} className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5 space-y-4">
                                        <div className="h-4 w-1/2 bg-neutral-200 rounded" />
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <div className="h-11 bg-neutral-200 rounded-lg" />
                                            <div className="h-11 bg-neutral-200 rounded-lg" />
                                        </div>
                                        <div className="h-11 bg-neutral-200 rounded-lg" />
                                        <div className="h-11 bg-neutral-200 rounded-lg" />
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 space-y-4">
                                <div className="h-4 w-28 bg-neutral-200 rounded" />
                                <div className="h-16 bg-neutral-200 rounded" />
                                <div className="h-11 bg-neutral-200 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!storeId || !store) {
        return null;
    }

    const storeSubtotal = storeItems.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
    );
    const storeTotal = storeSubtotal; // Add shipping here if implemented
    const currency = storeItems[0]?.product.currency || "UGX";
    const FALLBACK_PRODUCT_IMAGE = "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg";
    const resolvedStoreSlug = storeSlug || store.slug || "";

    const navigateToCart = () => {
        router.push(`/${resolvedStoreSlug}/cart`);
    };

    const pollPaymentStatus = async (slug: string, orderId: string) => {
        const maxAttempts = 45;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 4000));

            const statusRes = await fetch(`${API_BASE}/api/storefront/${slug}/payments/relworx/status/${orderId}`);
            if (!statusRes.ok) {
                throw new Error("Failed to confirm payment status");
            }

            const statusData = await statusRes.json();
            const paymentStatus = statusData?.paymentStatus as string | undefined;

            if (paymentStatus === "paid") {
                return "paid";
            }

            if (paymentStatus === "failed") {
                return "failed";
            }
        }

        return "timeout" as const;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        setError(null);
        setIsAwaitingPayment(false);
        setPaymentInternalReference(null);

        try {
            const payload = {
                customerName: fullName,
                customerEmail: email,
                customerPhone: phone,
                paymentMethod,
                shippingAddress: {
                    street: address,
                    country: "Uganda",
                },
                items: storeItems.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                })),
            };

            const res = await fetch(
                `${API_BASE}/api/storefront/${store.slug}/orders`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) throw new Error("Checkout failed");

            const data = await res.json();
            const orderId = "order" in data ? data.order?.id : data.id;
            if (!orderId) throw new Error("Missing order ID");

            setIsAwaitingPayment(true);
            const initiateRes = await fetch(`${API_BASE}/api/storefront/${store.slug}/payments/relworx/initiate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    msisdn: phone,
                }),
            });

            const initiateData = await initiateRes.json().catch(() => ({}));
            if (!initiateRes.ok) {
                throw new Error(initiateData?.error || initiateData?.message || "Failed to initiate mobile money payment");
            }

            setPaymentInternalReference(initiateData?.internalReference || null);

            const paymentResult = await pollPaymentStatus(store.slug, orderId);
            if (paymentResult === "failed") {
                throw new Error("Payment failed or was cancelled. Please try again.");
            }
            if (paymentResult === "timeout") {
                throw new Error("Payment is still pending. Please complete the mobile money prompt and try again.");
            }

            await clearStoreFromCart(store.id);
            setIsSuccess(true);
            setTimeout(() => {
                const target = store?.slug ? `${window.location.origin}/${store.slug}` : `${window.location.origin}/`;
                window.location.assign(target);
            }, 1500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
            setIsSubmitting(false);
            setIsAwaitingPayment(false);
        }
    };

    if (isSubmitting && !isSuccess) {
        return (
            <div className="fixed inset-0 z-999 flex items-center justify-center text-center px-4 bg-white">
                <div>
                    <div className="p-8 rounded-none inline-block mb-8">
                        <HugeiconsIcon
                            icon={Loading03Icon}
                            className="h-10 w-10 text-purple-600 animate-spin"
                            strokeWidth={1.5}
                        />
                    </div>
                    <h1 className={`${geistSans.className} text-3xl tracking-widest font-semibold mb-4 leading-tight`}>
                        {isAwaitingPayment ? "Waiting for Payment" : "Processing Order"}
                    </h1>
                    <p className="text-neutral-500 mb-10 max-w-sm mx-auto uppercase tracking-wider text-xs">
                        {isAwaitingPayment
                            ? `Check your phone and approve the ${currency} mobile money payment prompt.`
                            : `Please wait while we prepare your payment request with ${store.name}.`}
                    </p>
                    {paymentInternalReference ? (
                        <p className="text-neutral-400 uppercase tracking-wider text-[10px]">Ref: {paymentInternalReference}</p>
                    ) : null}
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center text-center px-4 bg-white">
                <div>
                    <div className="bg-neutral-100 p-8 rounded-none inline-block mb-8">
                        <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            className="h-10 w-10 text-neutral-900"
                            strokeWidth={1.5}
                        />
                    </div>
                    <h1 className={`${geistSans.className} text-3xl uppercase tracking-widest font-semibold mb-4 leading-tight`}>
                        Order Confirmed
                    </h1>
                    <p className="text-neutral-500 mb-10 max-w-sm mx-auto uppercase tracking-wider text-xs">
                        Thank you for shopping with {store.name}. Your order receipt has been sent to your email.
                    </p>
                    <Link href="/">
                        <Button className="h-14 rounded-none px-10 uppercase text-xs tracking-widest font-semibold transition-colors">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-20 pb-24">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
                <div className="rounded-2xl border border-neutral-200 bg-white/90 shadow-sm overflow-hidden">
                    <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                        {/* LEFT — CHECKOUT FORM */}
                        <div className="order-2 lg:order-1 p-5 sm:p-7 lg:p-10 bg-white">
                            <form
                                onSubmit={handleSubmit}
                                className="w-full max-w-2xl space-y-10"
                            >
                                <div className="space-y-6">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button onClick={navigateToCart} type="button" className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full p-2 transition-colors">
                                            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                                        </button>
                                        <span className="text-xs font-semibold text-neutral-400 tracking-widest">Checkout</span>
                                        <HugeiconsIcon
                                            icon={ArrowRight01Icon}
                                            className="h-3 w-3 text-neutral-300"
                                        />
                                        <Link href="/" className={`${geistSans.className} text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity`}>
                                            {capitalizeFirst(store.name)}
                                        </Link>
                                    </div>

                                    <div className="space-y-5 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 sm:p-6 shadow-sm">
                                        <h2 className={`${geistSans.className} text-lg tracking-widest font-semibold`}>Shipping Information</h2>

                                        <div className="space-y-4">
                                            <Input
                                                placeholder="Full Name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="h-12 rounded-lg text-sm"
                                                required
                                            />

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Input
                                                    placeholder="Email Address"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="h-12 rounded-lg text-sm"
                                                    required
                                                />
                                                <Input
                                                    placeholder="Phone Number"
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="h-12 rounded-lg text-sm"
                                                    required
                                                />
                                            </div>

                                            <Input
                                                placeholder="Delivery Address (e.g. 123 Main St, Kampala)"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                className="h-12 rounded-lg text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 sm:p-6 shadow-sm">
                                    <h2 className={`${geistSans.className} text-lg tracking-widest font-semibold`}>Payment</h2>
                                    <div className="p-4 rounded-xl border border-neutral-200 bg-white">
                                        <p className="text-sm text-neutral-600 leading-relaxed">
                                            You will pay now via mobile money. Once payment is successful, your order is confirmed automatically.
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-12 rounded-md uppercase text-xs tracking-widest font-semibold transition-colors flex items-center justify-center gap-3"
                                        disabled={isSubmitting}
                                    >
                                        <span>
                                            Pay {currency} {storeTotal.toLocaleString(undefined, { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 })}
                                        </span>
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* RIGHT — ORDER SUMMARY */}
                        <div className="order-1 lg:order-2 bg-neutral-50/70 border-b lg:border-b-0 lg:border-l border-neutral-200 p-5 sm:p-7 lg:p-10">
                            <div className="w-full max-w-xl mx-auto space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className={`${geistSans.className} text-lg uppercase tracking-widest font-semibold`}>Order Summary</h2>
                                </div>

                                <div className="space-y-4">
                                    {storeItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group flex gap-4 items-center rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                                        >
                                            <div className="relative h-20 w-20 shrink-0">
                                                <div className="relative h-full w-full bg-white overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
                                                    {item.product.contentType?.startsWith("video/") || item.product.image?.match(/\.(mp4|webm|mov|ogg)$/i) || ((item.product.image || "").includes(".ufs.sh") && !(item.product.image || "").match(/\.(jpg|jpeg|png|webp|gif)$/i) && !item.product.contentType?.startsWith("image/")) ? (
                                                        <video
                                                            src={item.product.image || ""}
                                                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
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
                                                            sizes="80px"
                                                            className="object-cover transition-transform duration-200 group-hover:scale-110"
                                                            unoptimized={(item.product.image || "").includes(".ufs.sh")}
                                                        />
                                                    )}
                                                </div>
                                                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center z-20 border border-neutral-50">
                                                    {item.quantity}
                                                </span>
                                            </div>

                                            <div className="flex-1 flex flex-col gap-1">
                                                <p className="font-serif text-base leading-tight">
                                                    {capitalizeFirst(item.product.name)}
                                                </p>
                                                {/* <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                                                    Standard Variant
                                                </p> */}
                                            </div>

                                            <div className="text-right whitespace-nowrap">
                                                <sub className="text-[10px] uppercase font-normal text-neutral-500 mr-0.5">{currency}</sub>
                                                <span className="text-lg font-bold text-neutral-900">
                                                    {(item.product.price * item.quantity).toLocaleString(undefined, {
                                                        minimumFractionDigits: currency === "USD" ? 2 : 0,
                                                        maximumFractionDigits: currency === "USD" ? 2 : 0
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3 shadow-sm">
                                    <div className="flex justify-between text-sm text-neutral-600">
                                        {/* <span>Subtotal</span>
                                        <span className="font-semibold text-neutral-900">
                                            <sub className="mr-0.5">{currency}</sub>
                                            {storeSubtotal.toLocaleString(undefined, { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 })}
                                        </span> */}
                                    </div>
                                    <div className="flex justify-between text-sm text-neutral-600">
                                        <span>Shipping</span>
                                        <span>Calculated after order confirmation</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-3 border-t border-neutral-200">
                                        <span className={`${geistSans.className} uppercase tracking-widest font-semibold`}>Total</span>
                                        <div className="text-right whitespace-nowrap">
                                            <sub className="text-xs uppercase font-normal text-neutral-500 mr-1">{currency}</sub>
                                            <span className="text-2xl font-bold text-neutral-900">
                                                {storeTotal.toLocaleString(undefined, { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white pt-20 pb-24">
                    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
                        <div className="rounded-2xl border border-neutral-200 bg-white/90 shadow-sm p-6 space-y-4 animate-pulse">
                            <div className="h-5 w-32 bg-neutral-100 rounded" />
                            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8">
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 space-y-3">
                                        <div className="h-4 w-28 bg-neutral-200 rounded" />
                                        <div className="h-11 bg-neutral-200 rounded" />
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <div className="h-11 bg-neutral-200 rounded" />
                                            <div className="h-11 bg-neutral-200 rounded" />
                                        </div>
                                        <div className="h-11 bg-neutral-200 rounded" />
                                    </div>
                                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 space-y-3">
                                        <div className="h-4 w-24 bg-neutral-200 rounded" />
                                        <div className="h-12 bg-neutral-200 rounded" />
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 space-y-3">
                                    <div className="h-4 w-24 bg-neutral-200 rounded" />
                                    <div className="h-16 bg-neutral-200 rounded" />
                                    <div className="h-10 bg-neutral-200 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <CheckoutContent />
        </Suspense>
    );
}
