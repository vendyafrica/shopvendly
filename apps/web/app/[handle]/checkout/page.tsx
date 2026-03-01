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
import { signInWithOneTap } from "@shopvendly/auth/react";
import { trackStorefrontEvents } from "@/app/[handle]/lib/storefront-tracking";
import { Bricolage_Grotesque } from "next/font/google";

const geistSans = Bricolage_Grotesque({
    variable: "--font-bricolage-grotesque",
    subsets: ["latin"],
});

const API_BASE = "";
const PAYMENTS_API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type PaystackPopup = {
    resumeTransaction: (accessCode: string, callback?: (resp: { status: string; reference: string }) => void) => void;
    newTransaction: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        onSuccess: (resp: { reference: string }) => void;
        onCancel: () => void;
    }) => void;
};

const loadPaystackPopup = (): Promise<new () => PaystackPopup> =>
    new Promise((resolve, reject) => {
        if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).PaystackPop) {
            resolve((window as unknown as Record<string, unknown>).PaystackPop as new () => PaystackPopup);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://js.paystack.co/v2/inline.js";
        script.onload = () => {
            const pop = (window as unknown as Record<string, unknown>).PaystackPop;
            if (pop) resolve(pop as new () => PaystackPopup);
            else reject(new Error("Paystack InlineJS failed to load"));
        };
        script.onerror = () => reject(new Error("Failed to load Paystack InlineJS"));
        document.head.appendChild(script);
    });

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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

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
            <div className="min-h-screen bg-white">
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user?.id) {
            void trackStorefrontEvents(
                store.slug,
                [{ eventType: "signin_prompt_shown" }]
            );

            try {
                await signInWithOneTap({ callbackURL: window.location.href });
                void trackStorefrontEvents(
                    store.slug,
                    [{ eventType: "signin_success" }]
                );
            } catch (err) {
                void trackStorefrontEvents(
                    store.slug,
                    [{ eventType: err instanceof Error && err.name === "IdentityCredentialError" ? "signin_dismissed" : "signin_error" }]
                );
                if (!(err instanceof Error && err.name === "IdentityCredentialError")) {
                    console.error("One Tap failed", err);
                }
            }
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                customerName: fullName,
                customerEmail: email,
                customerPhone: phone,
                paymentMethod: "paystack",
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

            const callbackUrl = `${window.location.origin}/`;
            const initRes = await fetch(`${PAYMENTS_API_BASE}/api/payments/paystack/initialize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    amount: Math.round(storeTotal),
                    currency,
                    orderId,
                    callbackUrl,
                }),
            });

            if (!initRes.ok) {
                const initJson = await initRes.json().catch(() => ({}));
                throw new Error((initJson as { error?: string }).error || "Failed to initialize Paystack");
            }

            const { access_code, reference } = await initRes.json() as {
                access_code: string;
                reference: string;
            };

            const PaystackPop = await loadPaystackPopup();
            const popup = new PaystackPop();

            await new Promise<void>((resolve, reject) => {
                const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

                if (publicKey) {
                    popup.newTransaction({
                        key: publicKey,
                        email,
                        amount: Math.round(storeTotal),
                        currency,
                        ref: reference,
                        onSuccess: () => resolve(),
                        onCancel: () => reject(new Error("Payment cancelled")),
                    });
                } else {
                    popup.resumeTransaction(access_code, (resp) => {
                        if (resp.status === "success") resolve();
                        else reject(new Error("Payment not completed"));
                    });
                }
            });

            await clearStoreFromCart(store.id);
            setIsSuccess(true);
            setTimeout(() => {
                window.location.assign(`${window.location.origin}/`);
            }, 1500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

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
        <div className="min-h-screen bg-white">
            <div className="grid lg:grid-cols-2 min-h-screen">
                {/* LEFT — CHECKOUT FORM */}
                <div className="flex justify-center items-start p-6 lg:p-14 lg:pt-24 order-2 lg:order-1 bg-white">
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-lg space-y-10"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <button onClick={navigateToCart} type="button" className="text-neutral-500 hover:text-neutral-900 transition-colors -ml-1">
                                    <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                                </button>
                                <span className="text-xs font-semibold text-neutral-400 tracking-widest uppercase">Checkout</span>
                                <HugeiconsIcon
                                    icon={ArrowRight01Icon}
                                    className="h-3 w-3 text-neutral-300"
                                />
                                <Link href="/" className={`${geistSans.className} text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity`}>
                                    {store.name}
                                </Link>
                            </div>

                            <h2 className={`${geistSans.className} text-xl uppercase tracking-widest font-semibold mb-6`}>Shipping Information</h2>

                            <div className="space-y-4">
                                <Input
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="h-14 rounded-none text-sm"
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        placeholder="Email Address"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-14 rounded-none text-sm"
                                        required
                                    />
                                    <Input
                                        placeholder="Phone Number"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="h-14 rounded-none text-sm"
                                        required
                                    />
                                </div>

                                <Input
                                    placeholder="Delivery Address (e.g. 123 Main St, Kampala)"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="h-14 rounded-none text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-neutral-200">
                            <h2 className={`${geistSans.className} text-xl uppercase tracking-widest font-semibold mb-6`}>Payment</h2>
                            <div className="p-5 border border-neutral-200 bg-neutral-50/50 mb-8">
                                <p className="text-sm text-neutral-600 leading-relaxed max-w-sm">
                                    All transactions are secure and encrypted. You will be redirected to Paystack to complete your purchase securely.
                                </p>
                            </div>

                            {error && (
                                <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-14 rounded-none uppercase text-xs tracking-widest font-semibold transition-colors flex items-center justify-center gap-3"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <HugeiconsIcon
                                            icon={Loading03Icon}
                                            className="h-5 w-5 animate-spin"
                                        />
                                        Processing Order...
                                    </>
                                ) : (
                                    <span>Pay {currency} {storeTotal.toLocaleString(undefined, { minimumFractionDigits: currency === "USD" ? 2 : 0 })}</span>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* RIGHT — ORDER SUMMARY */}
                <div className="bg-neutral-50/50 lg:border-l border-neutral-200 overflow-y-auto order-1 lg:order-2">
                    <div className="flex justify-center items-start p-6 lg:p-14 lg:pt-24 border-b lg:border-b-0 border-neutral-200">
                        <div className="w-full max-w-md space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className={`${geistSans.className} text-xl uppercase tracking-widest font-semibold`}>Order Summary</h2>
                            </div>

                            <div className="space-y-6">
                                {storeItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-5 items-center"
                                    >
                                        <div className="relative h-20 w-16 bg-neutral-100 shrink-0 block overflow-hidden">
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
                                                    sizes="64px"
                                                    className="object-cover mix-blend-multiply"
                                                    unoptimized={(item.product.image || "").includes(".ufs.sh")}
                                                />
                                            )}
                                            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center z-10 border border-neutral-50">
                                                {item.quantity}
                                            </span>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-1">
                                            <p className="font-serif text-base leading-tight">
                                                {item.product.name}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                                                Standard Variant
                                            </p>
                                        </div>

                                        <p className="text-sm font-medium whitespace-nowrap">
                                            {currency} {(item.product.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 })}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-neutral-200 pt-6 space-y-4">
                                <div className="flex justify-between text-sm text-neutral-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-neutral-900">
                                        {currency} {storeSubtotal.toLocaleString(undefined, { minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm text-neutral-600">
                                    <span>Shipping</span>
                                    <span>Calculated next step</span>
                                </div>
                                <div className="flex justify-between items-end pt-4 border-t border-neutral-200">
                                    <span className={`${geistSans.className} uppercase tracking-widest font-semibold`}>Total</span>
                                    <div className="text-right">
                                        <span className="text-xs text-neutral-500 mr-2">{currency}</span>
                                        <span className="text-2xl font-medium">
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
    );
}

export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <HugeiconsIcon
                        icon={Loading03Icon}
                        className="h-8 w-8 animate-spin text-neutral-900"
                    />
                </div>
            }
        >
            <CheckoutContent />
        </Suspense>
    );
}
