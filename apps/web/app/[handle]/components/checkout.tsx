"use client";

import { useState } from "react";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { Label } from "@shopvendly/ui/components/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@shopvendly/ui/components/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

const API_BASE = "";

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

type CheckoutMode = "pay_now_mobile_money" | "pay_on_delivery";

export function Checkout({ open, onOpenChange, storeSlug, product, quantity }: CheckoutProps) {
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("pay_now_mobile_money");
    const paymentMethod = checkoutMode === "pay_now_mobile_money" ? "mtn_momo" : "cash_on_delivery";
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [successStage, setSuccessStage] = useState<"paid" | "processing">("paid");
    const [error, setError] = useState<string | null>(null);

    const totalAmount = product.price * quantity;

    const resetState = () => {
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setIsSuccess(false);
        setSuccessStage("paid");
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

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

            const data = await response.json();

            if (checkoutMode === "pay_on_delivery") {
                setIsSuccess(true);
                setSuccessStage("processing");
                setTimeout(() => {
                    if (storeSlug) {
                        window.location.assign(`${window.location.origin}/${storeSlug}`);
                    }
                }, 1200);
                return;
            }

            const normalizedPhone = customerPhone.replace(/\D/g, "");
            if (!normalizedPhone) {
                throw new Error("Phone number is required for mobile money payment.");
            }

            const initRes = await fetch(`/api/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: Math.round(totalAmount),
                    currency: "UGX",
                    phone_number: normalizedPhone,
                    provider: "iotec",
                    description: `Order ${data.order?.id ?? ""}`,
                    metadata: { orderId: data.order?.id ?? "", storeSlug },
                }),
            });

            if (!initRes.ok) {
                const initData = await initRes.json().catch(() => ({}));
                throw new Error((initData as { error?: { message?: string } }).error?.message || "Failed to initialize payment");
            }

            const collectJson = await initRes.json() as { data?: { reference?: string } };
            const reference = collectJson.data?.reference;
            if (!reference) {
                throw new Error("Missing transaction reference");
            }

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

            const orderId = data.order?.id ?? "";
            if (!orderId) {
                throw new Error("Missing order ID");
            }

            const markPaidRes = await fetch(`/api/storefront/orders/${orderId}/pay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            if (!markPaidRes.ok) {
                throw new Error("Payment captured but order update failed. Please contact support.");
            }

            setIsSuccess(true);
            setSuccessStage("paid");
            setTimeout(() => {
                if (storeSlug) {
                    window.location.assign(`${window.location.origin}/${storeSlug}`);
                }
            }, 1200);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to place order");
        } finally {
            setIsSubmitting(false);
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
                        <h2 className="text-2xl font-semibold mb-2">
                            {checkoutMode === "pay_now_mobile_money"
                                ? "Payment Confirmed!"
                                : successStage === "paid"
                                    ? "Order Placed!"
                                    : "Processing Order"}
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            {checkoutMode === "pay_now_mobile_money"
                                ? "Your mobile money payment was confirmed. The seller is now processing your order."
                                : successStage === "paid"
                                    ? "Check your WhatsApp for payment instructions and order updates."
                                    : "Your order is now being processed by the seller."}
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
                    {/* Order Summary */}
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

                    {/* Customer Details */}
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
                                Required for mobile money. Enter with country code and no plus sign.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Payment option</Label>
                        <div className="grid gap-2">
                            <button
                                type="button"
                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${checkoutMode === "pay_now_mobile_money" ? "border-foreground bg-muted/50" : "border-border"}`}
                                onClick={() => setCheckoutMode("pay_now_mobile_money")}
                            >
                                <span className="font-medium">Pay now (Mobile Money)</span>
                                <p className="text-xs text-muted-foreground">Pay immediately via mobile money prompt.</p>
                            </button>
                            <button
                                type="button"
                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${checkoutMode === "pay_on_delivery" ? "border-foreground bg-muted/50" : "border-border"}`}
                                onClick={() => setCheckoutMode("pay_on_delivery")}
                            >
                                <span className="font-medium">Pay on delivery</span>
                                <p className="text-xs text-muted-foreground">Place order now and receive a WhatsApp payment link.</p>
                            </button>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                        Payment method: <span className="font-medium text-foreground">{checkoutMode === "pay_now_mobile_money" ? "Mobile Money (Iotec via DGateway)" : "Pay on delivery"}</span>
                    </div>

                    {/* Notes */}
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
                                Placing Order...
                            </>
                        ) : (
                            checkoutMode === "pay_now_mobile_money"
                                ? `Pay ${product.currency} ${totalAmount.toLocaleString()}`
                                : "Place order"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
