"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Loading03Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@shopvendly/ui/components/badge";
import { Button } from "@shopvendly/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shopvendly/ui/components/dialog";
import { useTenant } from "@/modules/admin/context/tenant-context";

function collectoModeLabel(mode?: "automatic_per_order" | "manual_batch") {
  return mode === "manual_batch" ? "Manual payout" : "Automatic payout";
}

export function CollectoPayoutModal() {
  const { bootstrap } = useTenant();
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const storeId = bootstrap?.storeId ?? null;
  const storageKey = storeId ? `collecto-payout-announce-${storeId}` : null;

  React.useEffect(() => {
    if (!storageKey) return;
    if (typeof window === "undefined") return;

    const seen = window.localStorage.getItem(storageKey) === "1";
    if (!seen) {
      setOpen(true);
    }
  }, [storageKey]);

  const dismiss = React.useCallback(() => {
    setIsSaving(true);
    try {
      if (storageKey && typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, "1");
      }
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  }, [storageKey]);

  if (!bootstrap?.storeId) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        dismiss();
      } else {
        setOpen(true);
      }
    }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Payments update</Badge>
          </div>
          <DialogTitle className="text-2xl">New payout controls are ready</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            You can now decide whether customers pay the 3% transaction fee, and whether your payouts happen automatically after each order or wait for a manual trigger.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
          <div className="rounded-xl bg-background p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Fee pass-through</div>
            <div className="mt-2 text-base font-semibold text-foreground">
              {bootstrap.collectoPassTransactionFeeToCustomer ? "Customer pays fee" : "Store pays fee"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {bootstrap.collectoPassTransactionFeeToCustomer
                ? "Checkout shows the transaction fee as a separate line for the customer."
                : "Customers pay only the product total; your store absorbs the fee."}
            </p>
          </div>

          <div className="rounded-xl bg-background p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Payout mode</div>
            <div className="mt-2 text-base font-semibold text-foreground">
              {collectoModeLabel(bootstrap.collectoPayoutMode)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {bootstrap.collectoPayoutMode === "manual_batch"
                ? "Funds still move into Bulk automatically, then you trigger the seller payout when you want."
                : "Funds move all the way through automatically after each paid order."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm leading-6 text-emerald-950">
          <div className="flex items-center gap-2 font-semibold">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4" />
            What this means for your store
          </div>
          <ul className="mt-3 space-y-2 text-emerald-900/90">
            <li>• You can see what transaction fees are doing per store from Settings.</li>
            <li>• Manual payout mode lets you keep money in Bulk until you initiate a payout.</li>
            <li>• Your dashboard continues to show balance and paid-out totals.</li>
          </ul>
        </div>

        <DialogFooter className="mt-2">
          <Link
            href={`/admin/${bootstrap.storeSlug}/settings`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Review settings
            <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 h-4 w-4" />
          </Link>
          <Button className="rounded-xl" onClick={dismiss} disabled={isSaving}>
            {isSaving ? <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" /> : null}
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
