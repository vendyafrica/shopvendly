"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@shopvendly/ui/components/button";
import { Card } from "@shopvendly/ui/components/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Loading03Icon } from "@hugeicons/core-free-icons";

const API_BASE = ""; // same-origin

function formatCurrency(amount: string | null, currency: string | null) {
  const parsed = Number(amount || 0);
  const code = currency || "UGX";
  if (Number.isNaN(parsed)) return `${code} ${amount ?? "0"}`;
  return `${code} ${parsed.toLocaleString()}`;
}

export default function PayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.orderId as string | undefined;

  const amount = searchParams.get("amount");
  const currency = searchParams.get("currency");
  const orderNumber = searchParams.get("orderNumber") || orderId;

  const [isPaying, setIsPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayAmount = useMemo(() => formatCurrency(amount, currency), [amount, currency]);

  useEffect(() => {
    if (!orderId) {
      setError("Missing orderId");
    }
  }, [orderId]);

  const handlePay = async () => {
    if (!orderId) return;
    setIsPaying(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/storefront/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Payment failed");
      }
      setIsPaid(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-lg p-6">
        {isPaid ? (
          <div className="flex flex-col items-center text-center gap-3">
            <div className="rounded-full bg-green-100 p-3">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold">Payment confirmed</h1>
            <p className="text-muted-foreground">
              We’ve notified the seller and they’re preparing your order.
            </p>
            <Link href="/">
              <Button className="mt-2">Continue shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order</p>
              <h1 className="text-2xl font-semibold">{orderNumber}</h1>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-muted-foreground">Amount due</p>
              <p className="text-3xl font-semibold">{displayAmount}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              This is a test payment page. Tap Pay to simulate a successful payment.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handlePay} disabled={isPaying || !orderId} className="h-12">
              {isPaying ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay now"
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
