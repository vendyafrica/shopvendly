"use client";

import { Suspense } from "react";
import { useCheckout } from "@/modules/storefront/hooks/use-checkout";
import { CheckoutUI, CheckoutLoading } from "@/modules/storefront/components";

function CheckoutContent() {
    const {
        fullName, setFullName,
        address, setAddress,
        phone, setPhone,
        paymentMethod, setPaymentMethod,
        isSubmitting, error, isSuccess,
        storePolicy, paymentFlowStatus,
        paymentStatusMessage, phoneVerificationStatus,
        phoneVerificationMessage, showPaymentCancelHint,
        showStorePolicy, setShowStorePolicy,
        paymentPricing,
        storeItems, store, isLoaded,
        handleSubmit, resetPaymentRetryState, cancelCollectoPayment,
        paymentTransactionId, activeOrderId
    } = useCheckout();

    return (
        <CheckoutUI
            state={{
                fullName, address, phone, paymentMethod,
                isSubmitting, error, isSuccess,
                storePolicy, paymentFlowStatus,
                paymentStatusMessage, phoneVerificationStatus,
                phoneVerificationMessage, showPaymentCancelHint,
                showStorePolicy, paymentPricing, storeItems, store, isLoaded,
                paymentTransactionId, activeOrderId
            }}
            actions={{
                handleSubmit, resetPaymentRetryState, cancelCollectoPayment,
                setFullName, setAddress, setPhone, setPaymentMethod, setShowStorePolicy
            }}
        />
    );
}

export default function CheckoutPage() {
    return (
        <div className="min-h-screen bg-white">
            <Suspense fallback={<CheckoutLoading />}>
                <CheckoutContent />
            </Suspense>
        </div>
    );
}
