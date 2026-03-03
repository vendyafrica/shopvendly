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

type CheckoutMode = "pay_now_mobile_money" | "pay_on_delivery";

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
    const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("pay_now_mobile_money");
    const paymentMethod = checkoutMode === "pay_now_mobile_money" ? "mtn_momo" : "cash_on_delivery";

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
            if (itemCount > 0 && !store) router.push("/accountart");
        }
    }, [storeId, store, itemCount, router]);

    if (!storeId || !store) {
        return (
            <div className="text-center py-20">
                <h1 className="text-xl">No items to checkout.</h1>
                <Link href="/accountart" className="text-primary underline">
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

            if (checkoutMode === "pay_on_delivery") {
                await clearStoreFromCart(store.id);
                setIsSuccess(true);
                setTimeout(() => {
                    window.location.assign(getStorefrontUrl(store.slug));
                }, 1200);
                return;
            }

            const normalizedPhone = phone.replace(/\D/g, "");
            if (!normalizedPhone) throw new Error("Phone number is required for mobile money.");

            const collectRes = await fetch(`/api/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: Math.round(storeTotal),
                    currency: "UGX",
                    phone_number: normalizedPhone,
                    provider: "iotec",
                    description: `Order ${orderId}`,
                    metadata: { orderId, storeSlug: store.slug },
                }),
            });

            const collectData = await collectRes.json().catch(() => ({}));
            if (!collectRes.ok || (collectData as { error?: { message?: string } }).error) {
                throw new Error((collectData as { error?: { message?: string } }).error?.message || "Failed to initiate payment");
            }

            const reference = (collectData as { data?: { reference?: string } }).data?.reference;
            if (!reference) throw new Error("Missing transaction reference");

            let attempts = 0;
            const maxAttempts = 60;
            let completed = false;

            while (attempts < maxAttempts) {
                attempts += 1;
                await new Promise((resolve) => setTimeout(resolve, attempts === 1 ? 3000 : 5000));

                const statusRes = await fetch(`/api/checkout/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reference }),
                });

                const statusData = await statusRes.json().catch(() => ({}));
                const paymentStatus = (statusData as { data?: { status?: string } }).data?.status;

                if (paymentStatus === "completed") {
                    completed = true;
                    break;
                }

                if (paymentStatus === "failed") {
                    throw new Error("Payment failed. Please try again.");
                }
            }

            if (!completed) {
                throw new Error("Payment verification timed out. Please try again.");
            }

            const markPaidRes = await fetch(`/api/storefront/orders/${orderId}/pay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            if (!markPaidRes.ok) {
                throw new Error("Payment captured but order update failed. Please contact support.");
            }

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

                        <div className="grid gap-2">
                            <button
                                type="button"
                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${checkoutMode === "pay_now_mobile_money" ? "border-neutral-900 bg-neutral-100" : "border-neutral-200 bg-white"}`}
                                onClick={() => setCheckoutMode("pay_now_mobile_money")}
                            >
                                <span className="font-medium">Pay now (Mobile Money)</span>
                                <p className="text-xs text-neutral-500">Pay immediately via mobile money prompt.</p>
                            </button>
                            <button
                                type="button"
                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${checkoutMode === "pay_on_delivery" ? "border-neutral-900 bg-neutral-100" : "border-neutral-200 bg-white"}`}
                                onClick={() => setCheckoutMode("pay_on_delivery")}
                            >
                                <span className="font-medium">Pay on delivery</span>
                                <p className="text-xs text-neutral-500">Place order now and receive a WhatsApp payment link.</p>
                            </button>
                        </div>

                        <div className="p-3 rounded-lg bg-neutral-50 border text-sm text-neutral-600">
                            {checkoutMode === "pay_now_mobile_money"
                                ? "We’ll prompt payment on your phone right after order creation."
                                : "We’ll place your order as pending and send a WhatsApp payment link."}
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
                                <span>{checkoutMode === "pay_now_mobile_money" ? `Pay ${currency} ${storeTotal}` : "Place Order"}</span>
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
