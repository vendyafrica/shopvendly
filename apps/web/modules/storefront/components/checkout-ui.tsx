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

interface CheckoutUIProps {
    state: any;
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
        showStorePolicy, storeItems, store, isLoaded,
        paymentTransactionId, activeOrderId
    } = state;

    const {
        handleSubmit, cancelCollectoPayment,
        setFullName, setAddress, setPhone, setShowStorePolicy
    } = actions;

    if (!isLoaded || !store) return null;

    const storeSubtotal = storeItems.reduce(
        (acc: number, item: any) => acc + item.product.price * item.quantity,
        0,
    );
    const storeTotal = storeSubtotal;
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
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
                <div className="mb-8 flex items-center gap-4">
                    <Link href={`/${store.slug}/cart`} className="p-2 -ml-2 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-white transition-colors">
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
                    </Link>
                    <h1 className={`${geistSans.className} text-xl sm:text-2xl uppercase tracking-widest font-semibold`}>Checkout</h1>
                </div>

                <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="p-4 rounded-xl border border-red-100 bg-red-50 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Customer Information */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
                            <h2 className="text-sm uppercase tracking-widest font-semibold text-neutral-900">1. Customer Information</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] uppercase tracking-widest font-medium text-neutral-500">Full Name</label>
                                    <Input
                                        required
                                        placeholder="Enter your name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="h-11 rounded-lg border-neutral-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] uppercase tracking-widest font-medium text-neutral-500">Phone (Mobile Money)</label>
                                    <Input
                                        required
                                        type="tel"
                                        placeholder="07... or 07..."
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className={`h-11 rounded-lg border-neutral-200 ${phoneVerificationStatus === 'failed' ? 'border-red-300' : ''}`}
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
                                    placeholder="House number, street, or common landmark"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="h-11 rounded-lg border-neutral-200"
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
                            <h2 className="text-sm uppercase tracking-widest font-semibold text-neutral-900">2. Payment Method</h2>
                            <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-primary/20">
                                        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="text-primary h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-900">Mobile Money</p>
                                        <p className="text-xs text-neutral-500">Pay via MTN or Airtel</p>
                                    </div>
                                </div>
                                <div className="h-5 w-5 rounded-full border-4 border-primary" />
                            </div>
                        </div>

                        {/* Store Policy & CTA */}
                        <div className="space-y-4">
                            <p className="text-[11px] text-neutral-500 text-center leading-relaxed px-4">
                                By placing your order, you agree to our terms of service and the{" "}
                                <button type="button" onClick={() => setShowStorePolicy(true)} className="text-neutral-900 underline underline-offset-2 font-medium">
                                    Store Policy
                                </button>.
                            </p>
                            <Button type="submit" className="w-full h-14 rounded-2xl uppercase text-[13px] tracking-[0.15em] font-bold shadow-lg shadow-primary/10 group">
                                {isSubmitting ? "Processing..." : "Place Order"}
                                <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </form>

                    {/* Order Summary Column */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm sticky top-24">
                            <h2 className="text-sm uppercase tracking-widest font-semibold text-neutral-900 mb-6">Order Summary</h2>
                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {storeItems.map((item: any) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="relative h-16 w-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                                            <Image
                                                src={item.product.image || FALLBACK_PRODUCT_IMAGE}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-neutral-900 truncate">
                                                {item.product.name}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                Qty: {item.quantity} × {currency} {item.product.price.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 border-t border-neutral-100 pt-6 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Subtotal</span>
                                    <span className="font-semibold text-neutral-900">{currency} {storeSubtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Delivery</span>
                                    <span className="text-neutral-900 font-medium">Free</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
                                    <span className="text-sm uppercase tracking-widest font-bold text-neutral-900">Total</span>
                                    <span className="text-xl font-bold text-neutral-900">{currency} {storeTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Small Trust Badges */}
                        <div className="flex items-center justify-center gap-6 px-4">
                           <div className="flex flex-col items-center gap-1">
                               <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center">
                                   <HugeiconsIcon icon={CheckmarkCircle02Icon} className="text-neutral-400 h-4 w-4" />
                               </div>
                               <span className="text-[10px] uppercase tracking-widest font-semibold text-neutral-400">Secure</span>
                           </div>
                        </div>
                    </div>
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
