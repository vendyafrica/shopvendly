"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { Label } from "@shopvendly/ui/components/label";
import { getRootUrl } from "@/utils/misc";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@shopvendly/ui/components/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") || getRootUrl("");

type CheckoutPaymentMethod = "cash_on_delivery" | "mobile_money";

interface CheckoutProduct {
    id: string;
    name: string;
    price: number;
    currency: string;
    image?: string;
}

interface CheckoutProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeSlug: string;
    product: CheckoutProduct;
    quantity: number;
}

export function Checkout({ open, onOpenChange, storeSlug, product, quantity }: CheckoutProps) {
    const paymentPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("mobile_money");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentTransactionId, setPaymentTransactionId] = useState<string | null>(null);
    const [paymentReference, setPaymentReference] = useState<string | null>(null);

    const totalAmount = product.price * quantity;

    useEffect(() => {
        return () => {
            if (paymentPollRef.current) {
                clearTimeout(paymentPollRef.current);
            }
        };
    }, []);

    const resetState = () => {
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setIsSuccess(false);
        setError(null);
        setPaymentMethod("mobile_money");
        setPaymentTransactionId(null);
        setPaymentReference(null);
    };

    const clearPaymentPoll = () => {
        if (paymentPollRef.current) {
            clearTimeout(paymentPollRef.current);
            paymentPollRef.current = null;
        }
    };

    const finishSuccess = () => {
        setIsSuccess(true);
        setTimeout(() => {
            if (storeSlug) {
                window.location.assign(`${window.location.origin}/${storeSlug}`);
            }
        }, 1200);
    };

    const pollCollectoStatus = async (transactionId: string) => {
        const statusRes = await fetch(`${API_BASE}/api/storefront/${storeSlug}/payments/collecto/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId }),
        });

        const statusData = await statusRes.json().catch(() => ({}));

        if (!statusRes.ok) {
            throw new Error(
                typeof statusData?.error?.message === "string"
                    ? statusData.error.message
                    : "Unable to check mobile money payment status."
            );
        }

        const status = typeof statusData?.status === "string" ? statusData.status : "pending";

        if (status === "successful") {
            finishSuccess();
            return;
        }

        if (status === "failed") {
            setError("Mobile money payment failed. You can try again or use cash on delivery.");
            setIsSubmitting(false);
            return;
        }

        clearPaymentPoll();
        paymentPollRef.current = setTimeout(() => {
            void pollCollectoStatus(transactionId);
        }, 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setPaymentTransactionId(null);
        setPaymentReference(null);
        clearPaymentPoll();

        try {
            const response = await fetch(`${API_BASE}/api/storefront/${storeSlug}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerName,
                    customerEmail,
                    customerPhone: customerPhone || undefined,
                    paymentMethod,
                    notes: notes || undefined,
                    items: [
                        {
                            productId: product.id,
                            quantity,
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to place order");
            }

            const data = await response.json().catch(() => ({}));
            const orderId = typeof data?.id === "string" ? data.id : typeof data?.order?.id === "string" ? data.order.id : null;
            if (!orderId) {
                throw new Error("Missing order ID");
            }

            if (paymentMethod === "cash_on_delivery") {
                finishSuccess();
                return;
            }

            const initiateRes = await fetch(`${API_BASE}/api/storefront/${storeSlug}/payments/collecto/initiate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId,
                    phone: customerPhone,
                    amount: totalAmount,
                    reference: `${storeSlug}-${orderId}`,
                }),
            });

            const initiateData = await initiateRes.json().catch(() => ({}));

            if (!initiateRes.ok) {
                throw new Error(
                    typeof initiateData?.error?.message === "string"
                        ? initiateData.error.message
                        : "Failed to start mobile money payment."
                );
            }

            const transactionId = typeof initiateData?.transactionId === "string" ? initiateData.transactionId : null;
            const reference = typeof initiateData?.reference === "string" ? initiateData.reference : null;
            if (!transactionId) {
                throw new Error("Collecto payment started without a transaction reference.");
            }

            setPaymentTransactionId(transactionId);
            setPaymentReference(reference);
            await pollCollectoStatus(transactionId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to place order");
        } finally {
            if (paymentMethod === "cash_on_delivery") {
                setIsSubmitting(false);
            }
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onOpenChange(false);
            setTimeout(() => {
                resetState();
            }, 200);
        }
    };

    if (isSuccess) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="mb-4 rounded-full bg-green-100 p-3">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-12 w-12 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Order Placed!</h2>
                        <p className="text-muted-foreground mb-6">
                            {paymentMethod === "mobile_money"
                                ? "Your mobile money payment has been confirmed and your order is now being processed."
                                : "Your order has been received and is being worked on. Delivery coordination will continue by phone/WhatsApp."}
                        </p>
                        <Button onClick={handleClose} className="w-full">
                            Continue Shopping
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Checkout</DialogTitle>
                    <DialogDescription>
                        Complete your order for {product.name}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <h3 className="font-medium mb-3">Order Summary</h3>
                        <div className="flex justify-between text-sm">
                            <span>{product.name} × {quantity}</span>
                            <span>{product.currency} {(product.price * quantity).toLocaleString()}</span>
                        </div>
                        <div className="border-t mt-3 pt-3 flex justify-between font-medium">
                            <span>Total</span>
                            <span>{product.currency} {totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-medium">Your Details</h3>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">WhatsApp Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="2567XXXXXXXX"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter with country code so seller and delivery provider can reach you.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-sm font-medium">Payment method</div>
                        <div className="grid gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("mobile_money")}
                                className={`rounded-lg border p-3 text-left text-sm transition-colors ${paymentMethod === "mobile_money" ? "border-foreground bg-background" : "bg-muted/30 text-muted-foreground"}`}
                            >
                                <div className="font-medium text-foreground">Mobile money</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Pay now with mobile money.
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("cash_on_delivery")}
                                className={`rounded-lg border p-3 text-left text-sm transition-colors ${paymentMethod === "cash_on_delivery" ? "border-foreground bg-background" : "bg-muted/30 text-muted-foreground"}`}
                            >
                                <div className="font-medium text-foreground">Cash on delivery</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Place your order now and pay later when delivery is arranged.
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Order Notes (Optional)</Label>
                        <Input
                            id="notes"
                            placeholder="Any special instructions..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="rounded-md bg-destructive/10 text-destructive p-3 text-sm">
                            {error}
                        </div>
                    )}

                    {paymentTransactionId ? (
                        <div className="rounded-md border p-3 text-sm">
                            <div className="font-medium">Payment reference</div>
                            <div className="text-muted-foreground break-all">{paymentReference || paymentTransactionId}</div>
                        </div>
                    ) : null}

                    <Button
                        type="submit"
                        className="w-full h-12"
                        disabled={
                            isSubmitting ||
                            !customerName ||
                            !customerEmail ||
                            !customerPhone
                        }
                    >
                        {isSubmitting ? (
                            <>
                                <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                                {paymentMethod === "mobile_money" ? "Processing payment..." : "Placing Order..."}
                            </>
                        ) : (
                            paymentMethod === "mobile_money" ? "Pay with mobile money" : "Place order"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
