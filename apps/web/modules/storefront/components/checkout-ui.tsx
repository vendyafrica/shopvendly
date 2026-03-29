"use client";

import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Loading03Icon,
    CheckmarkCircle02Icon,
    ArrowRight01Icon,
    ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { bricolage as geistSans } from "@/utils/fonts";
import { CheckoutPaymentMethod, PaymentFlowStatus } from "@/modules/storefront/models/checkout";

type CheckoutStoreItem = {
    id: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        price: number;
        currency?: string;
        image?: string | null;
    };
};

type CheckoutUIState = {
    fullName: string;
    address: string;
    phone: string;
    paymentMethod: CheckoutPaymentMethod;
    isSubmitting: boolean;
    error: string | null;
    isSuccess: boolean;
    storePolicy: string | null;
    paymentFlowStatus: PaymentFlowStatus;
    paymentStatusMessage: string | null;
    phoneVerificationStatus: "idle" | "verifying" | "verified" | "failed";
    phoneVerificationMessage: string | null;
    showPaymentCancelHint: boolean;
    showStorePolicy: boolean;
    paymentPricing: {
        customerFeeAmount: number;
        customerPaidAmount: number;
        passTransactionFeeToCustomer: boolean;
    } | null;
    storeItems: CheckoutStoreItem[];
    store: {
        name: string;
        slug: string;
    } | null | undefined;
    isLoaded: boolean;
    paymentTransactionId: string | null;
    activeOrderId: string | null;
};

interface CheckoutUIProps {
    state: CheckoutUIState;
    actions: {
        handleSubmit: (e: React.FormEvent) => void;
        resetPaymentRetryState: () => void;
        cancelCollectoPayment: (txId: string | null, orderId: string | null, reason: string) => void;
        setFullName: (name: string) => void;
        setAddress: (address: string) => void;
        setPhone: (phone: string) => void;
        setPaymentMethod: (method: CheckoutPaymentMethod) => void;
        setShowStorePolicy: (show: boolean) => void;
    };
}

const getCheckoutLoadingCopy = (
    paymentMethod: CheckoutPaymentMethod,
    paymentFlowStatus: PaymentFlowStatus,
    paymentStatusMessage: string | null,
    storeName: string,
) => {
    if (paymentStatusMessage) return paymentStatusMessage;
    if (paymentMethod === "mobile_money") {
        if (paymentFlowStatus === "initiating") return "Sending a mobile money prompt to your phone.";
        if (paymentFlowStatus === "pending") return "Approve the payment prompt on your phone.";
        if (paymentFlowStatus === "awaiting_confirmation") return "We’re confirming your payment now.";
        return `We’re preparing your checkout with ${storeName}.`;
    }
    return `We’re placing your order with ${storeName} and preparing the next steps.`;
};

const getCheckoutLoadingLabel = (
    paymentMethod: CheckoutPaymentMethod,
    paymentFlowStatus: PaymentFlowStatus,
) => {
    if (paymentMethod === "mobile_money") {
        if (paymentFlowStatus === "pending") return "Waiting for payment approval";
        if (paymentFlowStatus === "awaiting_confirmation") return "Confirming your payment";
        if (paymentFlowStatus === "initiating") return "Sending mobile money prompt";
        return "Preparing payment";
    }
    return "Placing your order";
};

export function CheckoutUI({ state, actions }: CheckoutUIProps) {
    const {
        fullName, address, phone, paymentMethod,
        isSubmitting, error, isSuccess,
        storePolicy, paymentFlowStatus,
        paymentStatusMessage, phoneVerificationStatus,
        phoneVerificationMessage, showPaymentCancelHint,
        showStorePolicy, paymentPricing, storeItems, store, isLoaded,
        paymentTransactionId, activeOrderId
    } = state;

    const {
        handleSubmit, cancelCollectoPayment,
        setFullName, setAddress, setPhone, setShowStorePolicy
    } = actions;

    if (!isLoaded || !store) return null;

    const storeSubtotal = storeItems.reduce(
        (acc: number, item: CheckoutStoreItem) => acc + item.product.price * item.quantity,
        0,
    );
    const customerFeeAmount = paymentPricing?.customerFeeAmount ?? 0;
    const storeTotal = paymentPricing?.customerPaidAmount ?? storeSubtotal;
    const currency = storeItems[0]?.product.currency || "UGX";
    const FALLBACK_PRODUCT_IMAGE = "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg";

    if (isSubmitting && !isSuccess) {
        const loadingLabel = getCheckoutLoadingLabel(paymentMethod, paymentFlowStatus);
        const loadingCopy = getCheckoutLoadingCopy(paymentMethod, paymentFlowStatus, paymentStatusMessage, store.name);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-4">
                <div className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-xl">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/8 text-primary">
                        <HugeiconsIcon icon={Loading03Icon} className="h-8 w-8 animate-spin" strokeWidth={1.5} />
                    </div>
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
                        {loadingLabel}
                    </div>
                    <h1 className={`${geistSans.className} mb-2 text-2xl font-semibold leading-tight tracking-tight text-neutral-950`}>
                        {paymentMethod === "mobile_money" ? "Complete the payment on your phone" : "Finalizing your order"}
                    </h1>
                    <p className="mx-auto text-sm leading-6 text-neutral-600">{loadingCopy}</p>
                    {showPaymentCancelHint && (
                        <button
                            type="button"
                            className="mt-5 text-sm font-medium text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-900"
                            onClick={() => cancelCollectoPayment(paymentTransactionId, activeOrderId, "cancelled_by_customer")}
                        >
                            Cancel payment
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4 py-20">
                <div className="w-full max-w-md text-center">
                    <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={40} strokeWidth={1.5} />
                    </div>
                    <h1 className={`${geistSans.className} mb-4 text-3xl font-bold tracking-tight text-neutral-950`}>
                        Order successful!
                    </h1>
                    <p className="mb-10 text-neutral-600 leading-relaxed">
                        Thank you for shopping with <span className="font-semibold text-neutral-900">{store.name}</span>. Your order has been placed and is being processed.
                    </p>
                    <Link href={`/${store.slug}`}>
                        <Button className="h-12 w-full rounded-xl uppercase text-xs tracking-widest font-semibold">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50/30 pt-20 pb-24 lg:pt-24">
            <div className="w-full mx-auto px-0 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
                <div className="mb-8 flex items-center gap-4 px-4 sm:px-0">
                    <Link href={`/${store.slug}/cart`} className="p-2 -ml-2 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-white transition-colors">
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                    </Link>
                    <h1 className={`${geistSans.className} text-xl sm:text-2xl uppercase tracking-widest font-semibold`}>Checkout</h1>
                </div>

                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-0 sm:gap-8 lg:gap-12 items-start">
                    {/* Order Summary Column */}
                    <div className="w-full space-y-0 sm:space-y-6 lg:order-2">
                        <div className="rounded-none sm:rounded-[24px] border-x-0 sm:border border-black/5 bg-white p-6 sm:p-8 shadow-none sm:shadow-sm lg:sticky lg:top-24">
                            <h2 className="text-[13px] uppercase tracking-[0.2em] font-bold text-neutral-900 mb-8">Order Summary</h2>
                            <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {storeItems.map((item: CheckoutStoreItem) => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="relative h-16 w-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-black/5">
                                            <Image
                                                src={item.product.image || FALLBACK_PRODUCT_IMAGE}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-neutral-900 truncate mb-0.5">
                                                {item.product.name}
                                            </p>
                                            <p className="text-[13px] text-neutral-500">
                                                Qty: {item.quantity} <span className="mx-0.5 text-neutral-300">×</span> {currency} {item.product.price.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-neutral-100 pt-6">
                                <div className="space-y-4 text-[13px] mb-8">
                                    <div className="flex justify-between items-center">
                                        <span className="text-neutral-500">Subtotal</span>
                                        <span className="font-semibold text-neutral-900">{currency} {storeSubtotal.toLocaleString()}</span>
                                    </div>
                                    {customerFeeAmount > 0 ? (
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-500">Mobile money fee</span>
                                            <span className="text-neutral-900 font-medium">{currency} {customerFeeAmount.toLocaleString()}</span>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] uppercase tracking-[0.2em] font-bold text-neutral-900">Total</span>
                                    <span className="text-xl font-bold text-neutral-900 tracking-tight">{currency} {storeTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 lg:order-1">
                        {/* Payment Failure Alert */}
                        {paymentFlowStatus === "failed" && paymentStatusMessage && (
                            <div className="mx-4 sm:mx-0 p-4 rounded-xl border border-amber-100 bg-amber-50 text-amber-700 text-sm">
                                {paymentStatusMessage}
                            </div>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <div className="mx-4 sm:mx-0 p-4 rounded-xl border border-red-100 bg-red-50 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Customer Information */}
                        <div className="rounded-none sm:rounded-2xl border-x-0 sm:border border-neutral-200 bg-white p-6 sm:p-8 space-y-6 shadow-none sm:shadow-sm">
                            <h2 className="text-sm uppercase tracking-widest font-semibold text-neutral-900">Customer Information</h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] uppercase tracking-widest font-medium text-neutral-500">Full Name</label>
                                    <Input
                                        required
                                        placeholder="Enter your name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="h-11 rounded-lg border-neutral-200 text-base"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] uppercase tracking-widest font-medium text-neutral-500">Phone (Mobile Money)</label>
                                    <Input
                                        required
                                        type="tel"
                                        placeholder="0772123456"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className={`h-11 rounded-lg border-neutral-200 text-base ${phoneVerificationStatus === 'failed' ? 'border-red-300' : ''}`}
                                    />
                                    {phoneVerificationMessage && (
                                        <p className="text-[10px] text-red-500 mt-1 uppercase tracking-wider">{phoneVerificationMessage}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] uppercase tracking-widest font-medium text-neutral-500">Delivery Address</label>
                                <Input
                                    required
                                    placeholder="Location"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="h-11 rounded-lg border-neutral-200 text-base"
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="rounded-none sm:rounded-2xl border-x-0 sm:border border-neutral-200 p-6 sm:p-8 space-y-6">
                            <h2 className="text-sm uppercase tracking-widest font-semibold text-neutral-900">Payment</h2>
                        </div>

                        {/* CTA */}
                        <div className="px-4 sm:px-0 space-y-4">
                            <Button type="submit" className="w-full h-14 rounded-2xl uppercase text-[13px] tracking-[0.15em] font-bold shadow-lg shadow-primary/10 group">
                                {isSubmitting ? "Processing..." : activeOrderId && paymentFlowStatus === "failed" ? "Retry Payment" : "Place Order"}
                                <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <p className="text-center text-sm text-neutral-500">
                                {activeOrderId && paymentFlowStatus === "failed"
                                    ? "Your order is saved. Tap retry to send a new payment prompt to your phone."
                                    : "After placing your order, you\u2019ll be prompted on your phone to complete the payment via mobile money."}
                            </p>
                        </div>
                    </form>


                </div>
            </div>

            {/* Store Policy Modal (Simplified for refactor) */}
            {showStorePolicy && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white rounded-3xl p-8 max-h-[80vh] overflow-y-auto relative shadow-2xl">
                        <button
                            onClick={() => setShowStorePolicy(false)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-100 transition-colors"
                        >
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="rotate-45 h-5 w-5" />
                        </button>
                        <h3 className={`${geistSans.className} text-xl uppercase tracking-widest font-bold mb-6`}>Store Policy</h3>
                        <div className="prose prose-sm max-w-none text-neutral-600 leading-relaxed font-sans whitespace-pre-wrap">
                            {storePolicy || "No policy provided by this store."}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
