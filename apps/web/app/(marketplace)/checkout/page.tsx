"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Loading03Icon,
    CheckmarkCircle02Icon,
    ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { useCart } from "@/features/cart/context/cart-context";
import { useAppSession } from "@/contexts/app-session-context";
import { getStorefrontUrl } from "@/utils/misc";

const API_BASE = ""; // Force relative for same-origin internal API
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
    const storeId = searchParams.get("storeId");
    const { itemsByStore, clearStoreFromCart, itemCount } = useCart();
    const { session } = useAppSession();

    const storeItems = storeId ? itemsByStore[storeId] : [];
    const store = storeItems?.[0]?.store;

    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [failedImageKeys, setFailedImageKeys] = useState<Record<string, true>>({});

    useEffect(() => {
        if (session?.user) {
            setEmail(session.user.email || "");
            setFullName(session.user.name || "");
        }
    }, [session]);

    useEffect(() => {
        if (!storeId || !store) {
            if (itemCount > 0 && !store) router.push("/cart");
        }
    }, [storeId, store, itemCount, router]);

    if (!storeId || !store) {
        return (
            <div className="text-center py-20">
                <h1 className="text-xl">No items to checkout.</h1>
                <Link href="/cart" className="text-primary underline">
                    Return to Cart
                </Link>
            </div>
        );
    }

    const storeSubtotal = storeItems.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
    );
    const storeTotal = storeSubtotal;
    const currency = storeItems[0]?.product.currency || "UGX";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

            const callbackUrl = getStorefrontUrl(store.slug);
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
                window.location.assign(getStorefrontUrl(store.slug));
            }, 1200);
        } catch {
            setError("Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center px-4">
                <div>
                    <div className="bg-green-100 p-6 rounded-full inline-block mb-6">
                        <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            className="h-12 w-12 text-green-600"
                        />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">
                        Order Confirmed
                    </h1>
                    <p className="text-neutral-500 mb-6 max-w-md">
                        Thank you for shopping with {store.name}.
                    </p>
                    <Link href="/">
                        <Button size="lg" className="rounded-full px-8">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="grid lg:grid-cols-2 min-h-screen">
                {/* LEFT — FORM */}
                <div className="flex justify-center items-start p-6 lg:p-12 order-2 lg:order-1">
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-xl space-y-6"
                    >
                        <div className="flex items-center gap-2">
                            <Link href={getStorefrontUrl(store.slug)} className="text-xl font-semibold hover:underline hover:text-primary/80">
                                {store.name}
                            </Link>
                            <HugeiconsIcon
                                icon={ArrowRight01Icon}
                                className="h-4 w-4 text-neutral-400"
                            />
                            <h2 className="text-md font-semibold text-neutral-400">Checkout</h2>
                        </div>

                        <Input
                            placeholder="Full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />

                        <Input
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <Input
                            placeholder="Phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />

                        <Input
                            placeholder="Delivery address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />

                        <div className="p-3 rounded-lg bg-neutral-50 border text-sm text-neutral-600">
                            We’ll confirm your order and notify the seller. Payment on delivery or as arranged.
                        </div>

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl text-lg bg-[#004F71] hover:bg-[#f7cf2d] text-white hover:text-[#004F71] transition-colors flex items-center justify-center gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <HugeiconsIcon
                                        icon={Loading03Icon}
                                        className="mr-2 h-5 w-5 animate-spin"
                                    />
                                    Processing…
                                </>
                            ) : (
                                <span>Place Order</span>
                            )}
                        </Button>
                    </form>
                </div>

                {/* RIGHT — SUMMARY (SCROLLABLE) */}
                <div className="bg-neutral-50 lg:border-l overflow-y-auto order-1 lg:order-2">
                    <div className="flex justify-center items-start p-6 lg:p-12">
                        <div className="w-full max-w-md space-y-6">
                            <h2 className="text-xl font-semibold">Order details</h2>
                            {storeItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 items-center"
                                >
                                    <div className="relative h-16 w-16 rounded-lg overflow-hidden border bg-white">
                                        {item.product.image && (item.product.contentType?.startsWith("video/") || item.product.image?.match(/\.(mp4|webm|mov|ogg)$/i) || ((item.product.image || "").includes(".ufs.sh") && !(item.product.image || "").match(/\.(jpg|jpeg|png|webp|gif)$/i) && !item.product.contentType?.startsWith("image/"))) ? (
                                            <video
                                                src={item.product.image}
                                                className="h-full w-full object-cover"
                                                muted
                                                playsInline
                                                loop
                                                autoPlay
                                            />
                                        ) : item.product.image && !failedImageKeys[item.id] ? (
                                            <Image
                                                src={item.product.image}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                                unoptimized={item.product.image.includes("cdninstagram.com") || item.product.image.includes("scontent-")}
                                                onError={() => {
                                                    setFailedImageKeys((prev) => ({ ...prev, [item.id]: true }));
                                                }}
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-neutral-100 text-neutral-400 text-[10px] flex items-center justify-center px-1 text-center">
                                                No image
                                            </div>
                                        )}
                                        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-neutral-700 text-white text-xs flex items-center justify-center">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {item.product.name}
                                        </p>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {currency} {item.product.price}
                                    </p>
                                </div>
                            ))}

                            <div className="border-t pt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>
                                        {currency} {storeSubtotal}
                                    </span>
                                </div>
                                <div className="flex justify-between font-semibold text-base">
                                    <span>Total</span>
                                    <span>
                                        {currency} {storeTotal}
                                    </span>
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
                <div className="min-h-screen flex items-center justify-center">
                    <HugeiconsIcon
                        icon={Loading03Icon}
                        className="h-10 w-10 animate-spin text-neutral-400"
                    />
                </div>
            }
        >
            <CheckoutContent />
        </Suspense>
    );
}
