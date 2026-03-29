"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/modules/cart/context/cart-context";
import { useAppSession } from "@/contexts/app-session-context";
import { getRootUrl } from "@/utils/misc";
import { CheckoutPaymentMethod, PaymentFlowStatus, PhoneVerificationStatus } from "../models/checkout";

const COLLECTO_POLL_INTERVAL_MS = 3000;
const COLLECTO_ACTIVE_POLL_WINDOW_MS = 45000;
const COLLECTO_STALE_HINT_MS = 15000;
const COLLECTO_INITIATION_TIMEOUT_MS = 14000;
const COLLECTO_FEE_RATE = 0.03;

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") || getRootUrl("");

function calculateCollectoFee(amount: number) {
    return Math.round(Math.max(amount, 0) * COLLECTO_FEE_RATE);
}

function resolveCartQuantity(quantity: unknown) {
    if (typeof quantity === "number" && Number.isFinite(quantity)) {
        return Math.max(1, Math.floor(quantity));
    }
    return 1;
}

export function useCheckout() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const storeSlug = (params?.handle as string) || (params?.s as string);
    const paymentPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const storeId = searchParams.get("storeId");
    const buyNowProductId = searchParams.get("buyNowProductId");
    const buyNowQty = Number.parseInt(searchParams.get("buyNowQty") || "1", 10);
    const buyNowOptionsRaw = searchParams.get("buyNowOptions");
    
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
    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
    const [phoneVerificationStatus, setPhoneVerificationStatus] = useState<PhoneVerificationStatus>("idle");
    const [phoneVerificationMessage, setPhoneVerificationMessage] = useState<string | null>(null);
    const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
    const [showPaymentCancelHint, setShowPaymentCancelHint] = useState(false);
    const [showStorePolicy, setShowStorePolicy] = useState(false);
    const [paymentPricing, setPaymentPricing] = useState<{
        subtotalAmount: number;
        customerFeeAmount: number;
        customerPaidAmount: number;
        merchantReceivableAmount: number;
        passTransactionFeeToCustomer: boolean;
        payoutMode: "automatic_per_order" | "manual_batch";
    } | null>(null);
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
        paymentFlowStartedAtRef.current = null;
        setShowPaymentCancelHint(false);
        setPaymentFlowStatus("failed");
        setPaymentTransactionId(null);
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
        setPaymentStatusMessage(null);
        setError(null);
    };

    useEffect(() => {
        if (session?.user) {
            setFullName(session.user.name || "");
        }
    }, [session]);

    const [buyNowItem, setBuyNowItem] = useState<any>(null);

    useEffect(() => {
        if (!buyNowProductId || !storeSlug) return;
        let cancelled = false;
        fetch(`/api/storefront/${storeSlug}/products/${buyNowProductId}`)
            .then(res => res.json())
            .then(data => {
                if (!cancelled && data.id) {
                    let selectedOptions = [];
                    try {
                        if (buyNowOptionsRaw) selectedOptions = JSON.parse(buyNowOptionsRaw);
                    } catch (e) {}
                    
                    setBuyNowItem({
                        id: `buynow-${data.id}`,
                        quantity: resolveCartQuantity(buyNowQty),
                        product: {
                            id: data.id,
                            name: data.name || data.productName,
                            price: data.price || data.priceAmount,
                            currency: data.currency || "UGX",
                            image: data.media?.[0]?.media?.blobUrl || data.image,
                            slug: data.slug,
                            selectedOptions,
                        },
                        store: {
                            id: data.storeId || storeId,
                            name: storeSlug,
                            slug: storeSlug,
                        }
                    });
                }
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [buyNowProductId, storeSlug, buyNowQty, buyNowOptionsRaw, storeId]);

    const storeItems = useMemo(() => {
        if (buyNowItem) return [buyNowItem];
        return storeId
            ? (itemsByStore[storeId] ?? []).map((item) => ({
                  ...item,
                  quantity: resolveCartQuantity(item.quantity),
              }))
            : [];
    }, [itemsByStore, storeId, buyNowItem]);
    
    const store = storeItems?.[0]?.store;

    useEffect(() => {
        if (!isLoaded) return;
        if (!storeId || (!store && !buyNowProductId)) {
            router.push(`/${storeSlug || ""}/cart`);
        }
    }, [isLoaded, storeId, store, storeSlug, router, buyNowProductId]);

    useEffect(() => {
        const resolvedSlug = storeSlug || store?.slug;
        if (!resolvedSlug) return;

        let cancelled = false;
        const loadStorePolicy = async () => {
            try {
                const res = await fetch(`/api/storefront/${resolvedSlug}`);
                if (!res.ok) return;
                const data = (await res.json()) as {
                    storePolicy?: string | null;
                    collectoPassTransactionFeeToCustomer?: boolean;
                    collectoPayoutMode?: "automatic_per_order" | "manual_batch";
                };
                if (!cancelled) {
                    setStorePolicy(data.storePolicy ?? null);
                    const subtotalAmount = storeItems.reduce((acc: number, item) => acc + item.product.price * item.quantity, 0);
                    const passFee = Boolean(data.collectoPassTransactionFeeToCustomer);
                    const customerFeeAmount = passFee ? calculateCollectoFee(subtotalAmount) : 0;
                    const customerPaidAmount = subtotalAmount + customerFeeAmount;
                    setPaymentPricing({
                        subtotalAmount,
                        customerFeeAmount,
                        customerPaidAmount,
                        merchantReceivableAmount: Math.max(customerPaidAmount - calculateCollectoFee(customerPaidAmount), 0),
                        passTransactionFeeToCustomer: passFee,
                        payoutMode: data.collectoPayoutMode === "manual_batch"
                            ? "manual_batch"
                            : "automatic_per_order",
                    });
                }
            } catch {
                if (!cancelled) {
                    setStorePolicy(null);
                    setPaymentPricing(null);
                }
            }
        };
        void loadStorePolicy();
        return () => { cancelled = true; };
    }, [store?.slug, storeSlug, storeItems]);

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
        } catch {
            setPhoneVerificationStatus("failed");
            setPhoneVerificationMessage("We couldn't verify this mobile money number.");
            setVerifiedPhone(null);
            return false;
        }
    };

    const getPhaseMessage = (elapsedMs: number): string => {
        if (elapsedMs < 5000) return "A payment prompt is being sent to your phone...";
        if (elapsedMs < 15000) return "Check your phone and enter your PIN to approve the payment.";
        if (elapsedMs < 30000) return "Still waiting for payment confirmation. If you didn\u2019t receive a prompt, you can cancel and try again.";
        return "Payment is taking longer than expected. You can cancel and retry.";
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
                setPaymentStatusMessage(getPhaseMessage(elapsedMs));
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
            setPaymentStatusMessage(getPhaseMessage(elapsedMs));
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
        if (!store) return;
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
        setPaymentStatusMessage("Payment wasn\u2019t confirmed in time. Tap retry to send a new prompt.");
        setIsSubmitting(false);
        paymentFlowStartedAtRef.current = null;
        if (orderId) {
            void fetch(`${API_BASE}/api/storefront/${store?.slug}/payments/collecto/abandon`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, transactionId, reason: "expired_after_45_seconds" }),
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
            setPaymentStatusMessage("Payment request sent. Check your phone.");
            if (store) {
                saveCheckoutState(orderId, transactionId, reference, store.slug);
            }
            await pollCollectoStatus(transactionId, orderId);
        } catch {
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
                items: storeItems.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    selectedOptions: item.product.selectedOptions,
                })),
                amount: storeItems.reduce((acc: number, item) => acc + item.product.price * item.quantity, 0),
            };
            const res = await fetch(`${API_BASE}/api/storefront/${store?.slug}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error?.message || data?.message || "Checkout failed");
            const responseBody = data?.data ?? data;
            const orderId = responseBody.order?.id || responseBody.id;
            if (responseBody?.paymentPricing) {
                setPaymentPricing(responseBody.paymentPricing);
            }
            setActiveOrderId(orderId);
            if (!(await verifyPromise)) {
                setIsSubmitting(false);
                setPaymentFlowStatus("failed");
                return;
            }
            await initiateCollectoPayment(orderId);
        } catch (err: unknown) {
            handlePaymentFailure(err instanceof Error ? err.message : "Checkout failed");
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
        paymentPricing,
        storeItems, store, isLoaded,
        handleSubmit, resetPaymentRetryState, cancelCollectoPayment,
        paymentTransactionId, activeOrderId
    };
}
