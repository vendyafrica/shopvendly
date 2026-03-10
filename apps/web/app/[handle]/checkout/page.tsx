"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { useCart } from "@/features/cart/context/cart-context";
import { useAppSession } from "@/contexts/app-session-context";
import { getRootUrl } from "@/utils/misc";
import { Bricolage_Grotesque } from "next/font/google";

const geistSans = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

type CheckoutPaymentMethod = "cash_on_delivery" | "mobile_money";
type PaymentFlowStatus =
  | "idle"
  | "initiating"
  | "pending"
  | "successful"
  | "failed";
type PhoneVerificationStatus = "idle" | "verifying" | "verified" | "failed";

const COLLECTO_POLL_INTERVAL_MS = 5000;
const COLLECTO_MAX_POLL_ATTEMPTS = 24;
const COLLECTO_INITIATION_TIMEOUT_MS = 9000;

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") || getRootUrl("");

const capitalizeFirst = (value?: string | null) => {
  if (!value) return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
};

const isUsableTransactionId = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "null" && normalized !== "undefined";
};

const getCollectoPollIntervalMs = (attempt: number) => {
  if (attempt <= 1) return 1800;
  if (attempt <= 3) return 2500;
  if (attempt <= 6) return 4000;
  return COLLECTO_POLL_INTERVAL_MS;
};

function CheckoutContent() {
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
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("mobile_money");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [storePolicy, setStorePolicy] = useState<string | null>(null);
  const [paymentFlowStatus, setPaymentFlowStatus] =
    useState<PaymentFlowStatus>("idle");
  const [paymentTransactionId, setPaymentTransactionId] = useState<
    string | null
  >(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<
    string | null
  >(null);
  const [phoneVerificationStatus, setPhoneVerificationStatus] =
    useState<PhoneVerificationStatus>("idle");
  const [phoneVerificationMessage, setPhoneVerificationMessage] = useState<
    string | null
  >(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  const handlePaymentFailure = (message?: string | null) => {
    clearPaymentPoll();
    setPaymentFlowStatus("failed");
    setPaymentTransactionId(null);
    setPaymentReference(null);
    setPaymentStatusMessage(
      message?.trim() ||
        "Mobile money payment was declined. You can try again or use Cash on Delivery.",
    );
    setError(null);
    setIsSubmitting(false);
  };

  const resetPaymentRetryState = () => {
    clearPaymentPoll();
    setPaymentFlowStatus("idle");
    setPaymentTransactionId(null);
    setPaymentReference(null);
    setPaymentStatusMessage(null);
    setError(null);
  };

  const switchToCashOnDelivery = () => {
    clearPaymentPoll();
    setPaymentMethod("cash_on_delivery");
    setPaymentFlowStatus("idle");
    setPaymentTransactionId(null);
    setPaymentReference(null);
    setPaymentStatusMessage(
      "Mobile money was declined. You can place this order with Cash on Delivery instead.",
    );
    setError(null);
    setIsSubmitting(false);
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
        const res = await fetch(`${API_BASE}/api/storefront/${resolvedSlug}`);
        if (!res.ok) return;
        const data = (await res.json()) as { storePolicy?: string | null };
        if (!cancelled) {
          setStorePolicy(data.storePolicy ?? null);
        }
      } catch {
        if (!cancelled) {
          setStorePolicy(null);
        }
      }
    };

    void loadStorePolicy();

    return () => {
      cancelled = true;
    };
  }, [store?.slug, storeSlug]);

  useEffect(() => {
    return () => {
      if (paymentPollRef.current) {
        clearTimeout(paymentPollRef.current);
      }
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white pt-20 pb-24">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
          <div className="rounded-2xl border border-neutral-200 bg-white/90 shadow-sm p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
            <div className="h-5 w-32 bg-neutral-100 rounded" />
            <div className="grid lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5 space-y-4"
                  >
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
    0,
  );
  const storeTotal = storeSubtotal; // Add shipping here if implemented
  const currency = storeItems[0]?.product.currency || "UGX";
  const FALLBACK_PRODUCT_IMAGE =
    "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg";
  const resolvedStoreSlug = storeSlug || store.slug || "";

  const navigateToCart = () => {
    router.push(`/${resolvedStoreSlug}/cart`);
  };

  const clearPaymentPoll = () => {
    if (paymentPollRef.current) {
      clearTimeout(paymentPollRef.current);
      paymentPollRef.current = null;
    }
  };

  const verifyCollectoPhone = async (
    phoneValue: string,
    options?: { force?: boolean },
  ) => {
    const trimmed = phoneValue.trim();

    if (paymentMethod !== "mobile_money") {
      return true;
    }

    if (!trimmed) {
      setPhoneVerificationStatus("idle");
      setPhoneVerificationMessage(null);
      setVerifiedPhone(null);
      return false;
    }

    if (!options?.force && verifiedPhone === trimmed && phoneVerificationStatus === "verified") {
      return true;
    }

    setPhoneVerificationStatus("verifying");
    setPhoneVerificationMessage("Checking your mobile money number...");

    try {
      const res = await fetch(
        `${API_BASE}/api/storefront/${store.slug}/payments/collecto/verify-phone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: trimmed }),
        },
      );

      const data = await res.json().catch(() => ({}));
      const message =
        typeof data?.message === "string"
          ? data.message
          : typeof data?.error?.message === "string"
            ? data.error.message
            : "We couldn't verify this mobile money number.";

      if (!res.ok || data?.valid !== true) {
        setPhoneVerificationStatus("failed");
        setPhoneVerificationMessage(message);
        setVerifiedPhone(null);
        return false;
      }

      setPhoneVerificationStatus("verified");
      setPhoneVerificationMessage(message);
      setVerifiedPhone(trimmed);
      return true;
    } catch (err) {
      setPhoneVerificationStatus("failed");
      setPhoneVerificationMessage(
        err instanceof Error
          ? err.message
          : "We couldn't verify this mobile money number.",
      );
      setVerifiedPhone(null);
      return false;
    }
  };

  const finishSuccess = async () => {
    await clearStoreFromCart(store.id);
    setActiveOrderId(null);
    setPaymentFlowStatus("successful");
    setPaymentStatusMessage(
      paymentMethod === "mobile_money"
        ? "Payment confirmed successfully. Your order is now being processed."
        : "Your order has been placed successfully.",
    );
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const initiateCollectoPayment = async (orderId: string) => {
    setPaymentFlowStatus("initiating");
    setPaymentStatusMessage("Sending the payment request to your phone...");

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, COLLECTO_INITIATION_TIMEOUT_MS);

    let initiateRes: Response;
    try {
      initiateRes = await fetch(
        `${API_BASE}/api/storefront/${store.slug}/payments/collecto/initiate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            phone,
          }),
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeoutHandle);
    }

    const initiateData = await initiateRes.json().catch(() => ({}));
    if (!initiateRes.ok) {
      throw new Error(
        typeof initiateData?.error?.message === "string"
          ? initiateData.error.message
          : "Unable to start mobile money payment.",
      );
    }

    const fallbackMessage =
      typeof initiateData?.fallback?.message === "string"
        ? initiateData.fallback.message
        : typeof initiateData?.error?.message === "string"
          ? initiateData.error.message
          : null;
    const suggestedPaymentMethod =
      initiateData?.fallback?.suggestedPaymentMethod === "cash_on_delivery"
        ? "cash_on_delivery"
        : null;

    if (initiateData?.ok === false && suggestedPaymentMethod === "cash_on_delivery") {
      handlePaymentFailure(fallbackMessage);
      return;
    }

    const transactionId =
      typeof initiateData?.transactionId === "string"
        ? initiateData.transactionId
        : null;
    const reference =
      typeof initiateData?.reference === "string"
        ? initiateData.reference
        : null;

    if (!isUsableTransactionId(transactionId)) {
      handlePaymentFailure(
        fallbackMessage ||
          "Mobile money is unavailable right now. Please try again or use Cash on Delivery.",
      );
      return;
    }

    setPaymentTransactionId(transactionId);
    setPaymentReference(reference);
    setPaymentStatusMessage(
      "Payment request sent. Check your phone and approve the mobile money prompt.",
    );
    await pollCollectoStatus(transactionId, 1, orderId);
  };

  const pollCollectoStatus = async (
    transactionId: string,
    attempt = 1,
    orderId: string | null = activeOrderId,
  ) => {
    try {
      const statusRes = await fetch(
        `${API_BASE}/api/storefront/${store.slug}/payments/collecto/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId,
            orderId: orderId || undefined,
          }),
        },
      );

      const statusData = await statusRes.json().catch(() => ({}));

      if (!statusRes.ok) {
        throw new Error(
          typeof statusData?.error?.message === "string"
            ? statusData.error.message
            : "Unable to check mobile money payment status.",
        );
      }

      const status =
        typeof statusData?.status === "string" ? statusData.status : "pending";
      const statusMessage =
        typeof statusData?.message === "string"
          ? statusData.message
          : undefined;

      if (status === "successful") {
        setPaymentStatusMessage("Payment confirmed successfully.");
        clearPaymentPoll();
        await finishSuccess();
        return;
      }

      if (status === "failed") {
        const failureMessage =
          statusMessage ||
          "Mobile money payment was declined. You can try again or switch to cash on delivery.";
        handlePaymentFailure(failureMessage);
        return;
      }

      if (attempt >= COLLECTO_MAX_POLL_ATTEMPTS) {
        handlePaymentFailure(
          "Mobile money confirmation is taking too long right now. Please try again or use Cash on Delivery.",
        );
        return;
      }

      setPaymentFlowStatus("pending");
      setPaymentStatusMessage(
        "Waiting for payment confirmation from Collecto. Keep this page open for a moment.",
      );

      clearPaymentPoll();
      paymentPollRef.current = setTimeout(() => {
        void pollCollectoStatus(transactionId, attempt + 1, orderId);
      }, getCollectoPollIntervalMs(attempt));
    } catch (err) {
      handlePaymentFailure(
        err instanceof Error
          ? err.message
          : "Mobile money is unavailable right now. Please try again or use Cash on Delivery.",
      );
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
      if (paymentMethod === "mobile_money") {
        const phoneIsVerified = await verifyCollectoPhone(phone, {
          force: verifiedPhone !== phone.trim() || phoneVerificationStatus !== "verified",
        });

        if (!phoneIsVerified) {
          setIsSubmitting(false);
          return;
        }

        if (activeOrderId) {
          await initiateCollectoPayment(activeOrderId);
          return;
        }
      }

      const payload = {
        customerName: fullName,
        customerPhone: phone,
        paymentMethod,
        shippingAddress: {
          street: address,
          country: "Uganda",
        },
        items: storeItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedOptions: item.product.selectedOptions,
        })),
        amount: storeTotal,
      };

      const res = await fetch(`${API_BASE}/api/storefront/${store.slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error?.message === "string"
            ? data.error.message
            : typeof data?.message === "string"
              ? data.message
              : "Checkout failed",
        );
      }

      const orderId = "order" in data ? data.order?.id : data.id;
      if (!orderId) throw new Error("Missing order ID");
      setActiveOrderId(orderId);

      if (paymentMethod === "mobile_money") {
        await initiateCollectoPayment(orderId);
        return;
      }

      await finishSuccess();
    } catch (err: unknown) {
      if (paymentMethod === "mobile_money") {
        handlePaymentFailure(
          err instanceof Error
            ? err.message
            : "Mobile money is unavailable right now. Please try again or use Cash on Delivery.",
        );
        return;
      }

      setPaymentFlowStatus("failed");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setIsSubmitting(false);
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
          <h1
            className={`${geistSans.className} text-3xl tracking-widest font-semibold mb-4 leading-tight`}
          >
            {paymentMethod === "mobile_money"
              ? "Processing Payment"
              : "Processing Order"}
          </h1>
          <p className="text-neutral-500 mb-10 max-w-sm mx-auto uppercase tracking-wider text-xs">
            {paymentStatusMessage ||
              `Please wait while we confirm your order with ${store.name}.`}
          </p>
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
          <h1
            className={`${geistSans.className} text-3xl uppercase tracking-widest font-semibold mb-4 leading-tight`}
          >
            {paymentMethod === "mobile_money"
              ? "Payment Confirmed"
              : "Order Confirmed"}
          </h1>
          <p className="text-neutral-500 mb-6 max-w-sm mx-auto uppercase tracking-wider text-xs">
            {paymentMethod === "mobile_money"
              ? `Thank you for shopping with ${store.name}. Your payment was successful and your order is being processed.`
              : `Thank you for shopping with ${store.name}. Your order has been received and is being processed.`}
          </p>
          {paymentReference || paymentTransactionId ? (
            <div className="mb-8 mx-auto max-w-md rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left">
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                Payment reference
              </div>
              <div className="mt-2 break-all text-sm font-medium text-neutral-900">
                {paymentReference || paymentTransactionId}
              </div>
            </div>
          ) : null}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={`/${resolvedStoreSlug}`}>
              <Button className="h-14 rounded-none px-10 uppercase text-xs tracking-widest font-semibold transition-colors">
                Back to store
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="h-14 rounded-none px-10 uppercase text-xs tracking-widest font-semibold transition-colors">
                Home
              </Button>
            </Link>
          </div>
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
                    <button
                      onClick={navigateToCart}
                      type="button"
                      className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full p-2 transition-colors"
                    >
                      <HugeiconsIcon
                        icon={ArrowLeft01Icon}
                        className="h-5 w-5"
                      />
                    </button>
                    <span className="text-xs font-semibold text-neutral-400 tracking-widest">
                      Checkout
                    </span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="h-3 w-3 text-neutral-300"
                    />
                    <Link
                      href="/"
                      className={`${geistSans.className} text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity`}
                    >
                      {capitalizeFirst(store.name)}
                    </Link>
                  </div>

                  <div className="space-y-5 rounded-md border border-neutral-200 bg-neutral-50/60 p-5 sm:p-6 shadow-sm">
                    <h2
                      className="text-lg font-semibold"
                    >
                      Shipping Information
                    </h2>

                    <div className="space-y-4">
                      <Input
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setActiveOrderId(null);
                        }}
                        className="h-12 rounded-lg text-sm"
                        required
                      />

                      <div className="space-y-4">
                        <Input
                          placeholder="Phone Number"
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            const nextPhone = e.target.value;
                            setPhone(nextPhone);
                            setActiveOrderId(null);
                            setVerifiedPhone(null);
                            if (phoneVerificationStatus !== "idle") {
                              setPhoneVerificationStatus("idle");
                              setPhoneVerificationMessage(null);
                            }
                          }}
                          onBlur={() => {
                            if (paymentMethod === "mobile_money") {
                              void verifyCollectoPhone(phone, { force: true });
                            }
                          }}
                          className="h-12 rounded-lg text-sm"
                          required
                        />
                        {paymentMethod === "mobile_money" &&
                        phoneVerificationStatus !== "idle" &&
                        phoneVerificationMessage ? (
                          <div
                            className={`rounded-lg border px-3 py-2 text-xs ${
                              phoneVerificationStatus === "verified"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : phoneVerificationStatus === "failed"
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-neutral-200 bg-white text-neutral-600"
                            }`}
                          >
                            {phoneVerificationMessage}
                          </div>
                        ) : null}
                      </div>
                      <Input
                        placeholder="Delivery Address (e.g. 123 Main St, Kampala)"
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          setActiveOrderId(null);
                        }}
                        className="h-12 rounded-lg text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5 rounded-md border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900">
                      Payment method
                    </h2>
                    <p className="text-sm text-neutral-500">
                      Choose how you would like to pay.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("mobile_money");
                        resetPaymentRetryState();
                        if (phone.trim()) {
                          void verifyCollectoPhone(phone, { force: true });
                        }
                      }}
                      className={`rounded-md border p-4 text-left transition-colors focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/10 ${paymentMethod === "mobile_money" ? "border-primary bg-white" : "border-transparent bg-neutral-50"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${paymentMethod === "mobile_money" ? "border-primary/90" : "border-neutral-300"}`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${paymentMethod === "mobile_money" ? "bg-primary/90" : "bg-transparent"}`}
                          />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-neutral-900">
                            Mobile money
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("cash_on_delivery");
                        setActiveOrderId(null);
                        resetPaymentRetryState();
                        setPhoneVerificationStatus("idle");
                        setPhoneVerificationMessage(null);
                      }}
                      className={`rounded-2xl border p-4 text-left transition-colors focus-within:border-primary/50 focus-within:ring-[3px] focus-within:ring-primary/10 ${paymentMethod === "cash_on_delivery" ? "border-neutral-900 bg-white" : "border-transparent bg-neutral-50"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${paymentMethod === "cash_on_delivery" ? "border-primary/90" : "border-neutral-300"}`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${paymentMethod === "cash_on_delivery" ? "bg-primary/90" : "bg-transparent"}`}
                          />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-neutral-900">
                            Cash on delivery
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {paymentTransactionId ? (
                    <div className="p-4 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-600">
                      <div className="font-medium text-neutral-900">
                        Payment reference
                      </div>
                      <div className="mt-1 break-all">
                        {paymentReference || paymentTransactionId}
                      </div>
                    </div>
                  ) : null}

                  {paymentMethod === "mobile_money" &&
                  paymentFlowStatus !== "idle" &&
                  paymentStatusMessage ? (
                    <div className="p-4 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-600">
                      {paymentStatusMessage}
                    </div>
                  ) : null}

                  {paymentFlowStatus === "failed" ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          resetPaymentRetryState();
                        }}
                      >
                        Retry payment
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={switchToCashOnDelivery}
                      >
                        Use cash on delivery
                      </Button>
                    </div>
                  ) : null}

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-primary text-white text-sm font-semibold tracking-wide transition-colors hover:bg-primary/70 disabled:bg-neutral-300 disabled:text-neutral-500"
                    disabled={
                      isSubmitting ||
                      !fullName ||
                      !address ||
                      !phone ||
                      (paymentMethod === "mobile_money" &&
                        phoneVerificationStatus === "verifying")
                    }
                  >
                    {paymentMethod === "mobile_money"
                      ? "Continue to payment"
                      : "Place order"}
                  </Button>

                  {storePolicy ? (
                    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-linear-to-br from-white to-neutral-50/80">
                      <div className="border-b border-neutral-200/80 px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
                          Store Policy
                        </div>
                      </div>
                      <div className="px-4 py-3.5">
                        <div className="whitespace-pre-wrap text-[14px] leading-6 text-neutral-700">
                          {storePolicy}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </form>
            </div>

            {/* RIGHT — ORDER SUMMARY */}
            <div className="order-1 lg:order-2 bg-neutral-50/70 border-b lg:border-b-0 lg:border-l border-neutral-200 p-5 sm:p-7 lg:p-10">
              <div className="w-full max-w-xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h2
                    className={`${geistSans.className} text-lg uppercase tracking-widest font-semibold`}
                  >
                    Order Summary
                  </h2>
                </div>

                <div className="space-y-4">
                  {storeItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex gap-4 items-center rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="relative h-20 w-20 shrink-0">
                        <div className="relative h-full w-full bg-white overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
                          {item.product.contentType?.startsWith("video/") ||
                          item.product.image?.match(/\.(mp4|webm|mov|ogg)$/i) ||
                          ((item.product.image || "").includes(".ufs.sh") &&
                            !(item.product.image || "").match(
                              /\.(jpg|jpeg|png|webp|gif)$/i,
                            ) &&
                            !item.product.contentType?.startsWith("image/")) ? (
                            <video
                              src={item.product.image || ""}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110 bg-neutral-100"
                              muted
                              playsInline
                              loop
                              preload="metadata"
                            />
                          ) : (
                            <Image
                              src={item.product.image || FALLBACK_PRODUCT_IMAGE}
                              alt={item.product.name}
                              fill
                              sizes="80px"
                              className="object-cover transition-transform duration-200 group-hover:scale-110 bg-neutral-100"
                              unoptimized={(item.product.image || "").includes(
                                ".ufs.sh",
                              )}
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
                        {item.product.selectedOptions?.length ? (
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
                            {item.product.selectedOptions.map((option) => (
                              <span key={`${option.name}-${option.value}`}>
                                {option.name}: {option.value}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="text-right whitespace-nowrap">
                        <sub className="text-[10px] uppercase font-normal text-neutral-500 mr-0.5">
                          {currency}
                        </sub>
                        <span className="text-lg font-bold text-neutral-900">
                          {(item.product.price * item.quantity).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: currency === "USD" ? 2 : 0,
                              maximumFractionDigits: currency === "USD" ? 2 : 0,
                            },
                          )}
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
                    <span
                      className={`${geistSans.className} uppercase tracking-widest font-semibold`}
                    >
                      Total
                    </span>
                    <div className="text-right whitespace-nowrap">
                      <sub className="text-xs uppercase font-normal text-neutral-500 mr-1">
                        {currency}
                      </sub>
                      <span className="text-2xl font-bold text-neutral-900">
                        {storeTotal.toLocaleString(undefined, {
                          minimumFractionDigits: currency === "USD" ? 2 : 0,
                          maximumFractionDigits: currency === "USD" ? 2 : 0,
                        })}
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
