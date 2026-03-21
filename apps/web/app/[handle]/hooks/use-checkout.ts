"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/features/cart/context/cart-context";
import { useAppSession } from "@/contexts/app-session-context";
import { getRootUrl } from "@/utils/misc";
import { CheckoutPaymentMethod, PaymentFlowStatus, PhoneVerificationStatus } from "../models/checkout";

const COLLECTO_POLL_INTERVAL_MS = 5000;
const COLLECTO_ACTIVE_POLL_WINDOW_MS = 120000;
const COLLECTO_STALE_HINT_MS = 45000;
const COLLECTO_INITIATION_TIMEOUT_MS = 14000;

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") || getRootUrl("");

export function useCheckout() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const storeSlug = (params?.handle as string) || (params?.s as string);
    const paymentPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const storeId = searchParams.get("storeId");
    const { itemsByStore, clearStoreFromCart, isLoaded } = useCart();
    const { session } = useAppSession();

    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("mobile_money");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [storePolicy, setStorePolicy] = useState<string | null>(null);
    const [paymentFlowStatus, setPaymentFlowStatus] = useState<PaymentFlowStatus>("idle");
    const [paymentTransactionId, setPaymentTransactionId] = useState<string | null>(null);
    const [paymentReference, setPaymentReference] = useState<string | null>(null);
    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
    const [phoneVerificationStatus, setPhoneVerificationStatus] = useState<PhoneVerificationStatus>("idle");
    const [phoneVerificationMessage, setPhoneVerificationMessage] = useState<string | null>(null);
    const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
    const [showPaymentCancelHint, setShowPaymentCancelHint] = useState(false);
    const [showStorePolicy, setShowStorePolicy] = useState(false);
    const paymentFlowStartedAtRef = useRef<number | null>(null);

    const getStorageKey = () => `vendly_checkout_${storeId}`;

    const saveCheckoutState = (orderId: string, txId: string, ref: string | null, slug: string) => {
        if (!storeId) return;
        localStorage.setItem(
            getStorageKey(),
            JSON.stringify({ orderId, transactionId: txId, reference: ref, storeSlug: slug, timestamp: Date.now() })
        );
    };

    const clearCheckoutState = () => {
        if (!storeId) return;
        localStorage.removeItem(getStorageKey());
    };

    const handlePaymentFailure = (message?: string | null) => {
        clearPaymentPoll();
        clearCheckoutState();
        paymentFlowStartedAtRef.current = null;
        setShowPaymentCancelHint(false);
        setPaymentFlowStatus("failed");
        setPaymentTransactionId(null);
        setPaymentReference(null);
        setPaymentStatusMessage(
            message?.trim() || "Mobile money payment was declined. Please try again."
        );
        setError(null);
        setIsSubmitting(false);
    };

    const resetPaymentRetryState = () => {
        clearPaymentPoll();
        clearCheckoutState();
        paymentFlowStartedAtRef.current = null;
        setShowPaymentCancelHint(false);
        setPaymentFlowStatus("idle");
        setPaymentTransactionId(null);
        setPaymentReference(null);
        setPaymentStatusMessage(null);
        setError(null);
    };

    useEffect(() => {
        if (session?.user) {
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

    useEffect(() => {
        const resolvedSlug = storeSlug || store?.slug;
        if (!resolvedSlug) return;

        let cancelled = false;
        const loadStorePolicy = async () => {
            try {
                const res = await fetch(`/api/storefront/${resolvedSlug}`);
                if (!res.ok) return;
                const data = (await res.json()) as { storePolicy?: string | null };
                if (!cancelled) {
                    setStorePolicy(data.storePolicy ?? null);
                }
            } catch {
                if (!cancelled) setStorePolicy(null);
            }
        };
        void loadStorePolicy();
        return () => { cancelled = true; };
    }, [store?.slug, storeSlug]);

    const clearPaymentPoll = () => {
        if (paymentPollRef.current) {
            clearTimeout(paymentPollRef.current);
            paymentPollRef.current = null;
        }
    };

    const runSilentPhoneVerify = async (phoneValue: string): Promise<boolean> => {
        if (!store) return false;
        const currentStore = store;
        const trimmed = phoneValue.trim();
        if (!trimmed) return false;
        if (verifiedPhone === trimmed && phoneVerificationStatus === "verified") return true;

        setPhoneVerificationStatus("verifying");
        setPhoneVerificationMessage(null);
        try {
            const res = await fetch(`${API_BASE}/api/storefront/${currentStore.slug}/payments/collecto/verify-phone`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: trimmed }),
            });
            const data = await res.json().catch(() => ({}));
            const message = data?.message || data?.error?.message || "We couldn't verify this mobile money number.";
            if (!res.ok || data?.valid !== true) {
                setPhoneVerificationStatus("failed");
                setPhoneVerificationMessage(message);
                setVerifiedPhone(null);
                return false;
            }
            setPhoneVerificationStatus("verified");
            setPhoneVerificationMessage(null);
            setVerifiedPhone(trimmed);
            return true;
        } catch (err) {
            setPhoneVerificationStatus("failed");
            setPhoneVerificationMessage("We couldn't verify this mobile money number.");
            setVerifiedPhone(null);
            return false;
        }
    };

    const pollCollectoStatus = async (transactionId: string, orderId: string | null = activeOrderId) => {
        const startedAt = paymentFlowStartedAtRef.current ?? Date.now();
        const elapsedMs = Date.now() - startedAt;
        if (!paymentFlowStartedAtRef.current) paymentFlowStartedAtRef.current = startedAt;
        setShowPaymentCancelHint(elapsedMs >= COLLECTO_STALE_HINT_MS);

        try {
            const statusRes = await fetch(`${API_BASE}/api/storefront/${store?.slug}/payments/collecto/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactionId, orderId: orderId || undefined }),
            });
            const statusData = await statusRes.json().catch(() => ({}));
            if (!statusRes.ok) {
                if (Date.now() - startedAt >= COLLECTO_ACTIVE_POLL_WINDOW_MS) {
                    finalizeCollectoPendingState(transactionId, orderId);
                    return;
                }
                setPaymentFlowStatus("pending");
                setPaymentStatusMessage("We are still confirming your payment...");
                clearPaymentPoll();
                paymentPollRef.current = setTimeout(() => void pollCollectoStatus(transactionId, orderId), COLLECTO_POLL_INTERVAL_MS);
                return;
            }
            const status = statusData?.status || "pending";
            if (status === "successful") {
                setPaymentStatusMessage("Payment confirmed successfully.");
                clearPaymentPoll();
                await finishSuccess();
                return;
            }
            if (status === "failed") {
                handlePaymentFailure(statusData?.message || "Mobile money payment was declined.");
                return;
            }
            if (elapsedMs >= COLLECTO_ACTIVE_POLL_WINDOW_MS) {
                finalizeCollectoPendingState(transactionId, orderId);
                return;
            }
            setPaymentFlowStatus("pending");
            setPaymentStatusMessage(elapsedMs >= COLLECTO_STALE_HINT_MS ? "Still waiting..." : "Waiting for confirmation...");
            clearPaymentPoll();
            paymentPollRef.current = setTimeout(() => void pollCollectoStatus(transactionId, orderId), COLLECTO_POLL_INTERVAL_MS);
        } catch {
            if (elapsedMs < COLLECTO_ACTIVE_POLL_WINDOW_MS) {
                clearPaymentPoll();
                paymentPollRef.current = setTimeout(() => void pollCollectoStatus(transactionId, orderId), COLLECTO_POLL_INTERVAL_MS);
            } else {
                finalizeCollectoPendingState(transactionId, orderId);
            }
        }
    };

    const finishSuccess = async () => {
        clearCheckoutState();
        paymentFlowStartedAtRef.current = null;
        setShowPaymentCancelHint(false);
        await clearStoreFromCart(store.id);
        setActiveOrderId(null);
        setPaymentFlowStatus("successful");
        setIsSubmitting(false);
        setIsSuccess(true);
    };

    const finalizeCollectoPendingState = (transactionId: string, orderId: string | null) => {
        clearPaymentPoll();
        setShowPaymentCancelHint(false);
        setPaymentFlowStatus("failed");
        setPaymentStatusMessage("Payment prompt expired. Please try again.");
        setIsSubmitting(false);
        paymentFlowStartedAtRef.current = null;
        clearCheckoutState();
        if (orderId) {
            void fetch(`${API_BASE}/api/storefront/${store?.slug}/payments/collecto/abandon`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, transactionId, reason: "expired_after_90_seconds" }),
            }).catch(() => undefined);
        }
    };

    const initiateCollectoPayment = async (orderId: string) => {
        paymentFlowStartedAtRef.current = Date.now();
        setShowPaymentCancelHint(false);
        setPaymentFlowStatus("initiating");
        setPaymentStatusMessage("Sending the payment request to your phone...");

        const controller = new AbortController();
        const timeoutHandle = setTimeout(() => controller.abort(), COLLECTO_INITIATION_TIMEOUT_MS);

        try {
            const initiateRes = await fetch(`${API_BASE}/api/storefront/${store?.slug}/payments/collecto/initiate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, phone }),
                signal: controller.signal,
            });
            clearTimeout(timeoutHandle);
            const initiateData = await initiateRes.json().catch(() => ({}));
            if (!initiateRes.ok || initiateData?.ok === false) {
                handlePaymentFailure(initiateData?.fallback?.message || initiateData?.error?.message || "Unable to start payment.");
                return;
            }
            const transactionId = initiateData?.transactionId;
            const reference = initiateData?.reference;
            setPaymentTransactionId(transactionId);
            setPaymentReference(reference);
            setPaymentStatusMessage("Payment request sent. Check your phone.");
            if (store) {
                saveCheckoutState(orderId, transactionId, reference, store.slug);
            }
            await pollCollectoStatus(transactionId, orderId);
        } catch (err) {
            handlePaymentFailure("Unable to start mobile money payment.");
        }
    };

    const cancelCollectoPayment = async (transactionId: string | null, orderId: string | null, reason: string) => {
        clearPaymentPoll();
        setShowPaymentCancelHint(false);
        paymentFlowStartedAtRef.current = null;
        clearCheckoutState();
        setIsSubmitting(false);
        setPaymentFlowStatus("failed");
        setPaymentStatusMessage("Payment cancelled.");
        if (transactionId && orderId && store) {
            void fetch(`${API_BASE}/api/storefront/${store.slug}/payments/collecto/abandon`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, transactionId, reason }),
            }).catch(() => undefined);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setPaymentStatusMessage(null);
        setPaymentTransactionId(null);
        setPaymentReference(null);
        setPaymentFlowStatus("idle");
        clearPaymentPoll();

        try {
            if (activeOrderId) {
                if (!(verifiedPhone === phone.trim() && phoneVerificationStatus === "verified")) {
                    const ok = await runSilentPhoneVerify(phone);
                    if (!ok) { setIsSubmitting(false); return; }
                }
                await initiateCollectoPayment(activeOrderId);
                return;
            }
            const verifyPromise = runSilentPhoneVerify(phone);
            const payload = {
                customerName: fullName,
                customerPhone: phone,
                paymentMethod,
                shippingAddress: { street: address, country: "Uganda" },
                items: (storeItems || []).map((item: any) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    selectedOptions: item.product.selectedOptions,
                })),
                amount: (storeItems || []).reduce((acc: number, item: any) => acc + item.product.price * item.quantity, 0),
            };
            const res = await fetch(`${API_BASE}/api/storefront/${store?.slug}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error?.message || data?.message || "Checkout failed");
            const orderId = data.order?.id || data.id;
            setActiveOrderId(orderId);
            if (!(await verifyPromise)) {
                setIsSubmitting(false);
                setPaymentFlowStatus("failed");
                return;
            }
            await initiateCollectoPayment(orderId);
        } catch (err: any) {
            handlePaymentFailure(err.message);
        }
    };

    return {
        fullName, setFullName,
        address, setAddress,
        phone, setPhone,
        paymentMethod, setPaymentMethod,
        isSubmitting, error, isSuccess,
        storePolicy, paymentFlowStatus,
        paymentStatusMessage, phoneVerificationStatus,
        phoneVerificationMessage, showPaymentCancelHint,
        showStorePolicy, setShowStorePolicy,
        storeItems, store, isLoaded,
        handleSubmit, resetPaymentRetryState, cancelCollectoPayment,
        paymentTransactionId, activeOrderId
    };
}
