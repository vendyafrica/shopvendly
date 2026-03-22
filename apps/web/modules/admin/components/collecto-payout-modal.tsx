"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { Switch } from "@shopvendly/ui/components/switch";
import {
  Dialog,
  DialogContent,
} from "@shopvendly/ui/components/dialog";
import {
  Sheet,
  SheetContent,
} from "@shopvendly/ui/components/sheet";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { useIsMobile } from "@shopvendly/ui/hooks/use-mobile";
import { cn } from "@shopvendly/ui/lib/utils";


export function CollectoPayoutModal() {
  const { bootstrap, refetch } = useTenant();
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const isMobile = useIsMobile();

  // Local state for toggles
  const [passFee, setPassFee] = React.useState(false);
  const [payoutMode, setPayoutMode] = React.useState<"automatic_per_order" | "manual_batch">("automatic_per_order");

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

  React.useEffect(() => {
    if (bootstrap) {
      setPassFee(Boolean(bootstrap.collectoPassTransactionFeeToCustomer));
      setPayoutMode(bootstrap.collectoPayoutMode || "automatic_per_order");
    }
  }, [bootstrap]);

  const onSave = async () => {
    if (!storeId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectoPassTransactionFeeToCustomer: passFee,
          collectoPayoutMode: payoutMode,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      
      await refetch();
      dismiss();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const dismiss = React.useCallback(() => {
    if (storageKey && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, "1");
    }
    setOpen(false);
  }, [storageKey]);

  if (!bootstrap?.storeId) return null;

  const content = (
    <div className={cn(
      "flex flex-col gap-6",
      isMobile ? "p-6" : "p-4"
    )}>
      <div className="flex flex-col gap-2">
        <h2 className={cn(
          "font-bold tracking-tight text-foreground",
          isMobile ? "text-xl" : "text-2xl"
        )}>
          Update your payout preferences
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          New controls are available for transaction fees and payout schedules.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between rounded-2xl border bg-muted/20 p-4 gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Transaction Fee</div>
            <div className="text-sm font-semibold">Pass to customer</div>
            <p className="text-xs text-muted-foreground leading-snug">
              Customers cover the 3% fee at checkout.
            </p>
          </div>
          <Switch checked={passFee} onCheckedChange={setPassFee} className="mt-1" />
        </div>

        <div className="flex items-start justify-between rounded-2xl border bg-muted/20 p-4 gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Payout Schedule</div>
            <div className="text-sm font-semibold">Manual payouts</div>
            <p className="text-xs text-muted-foreground leading-snug">
              Batching payouts saves you money by reducing total payout fees.
            </p>
          </div>
          <Switch 
            checked={payoutMode === "manual_batch"} 
            onCheckedChange={(checked: boolean) => setPayoutMode(checked ? "manual_batch" : "automatic_per_order")} 
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button 
          variant="ghost"
          className="h-10 rounded-xl px-6 font-semibold text-muted-foreground" 
          onClick={dismiss}
        >
          Maybe later
        </Button>
        <Button 
          className="h-10 rounded-xl px-8 font-bold shadow-lg shadow-primary/20" 
          onClick={onSave} 
          disabled={isSaving}
        >
          {isSaving ? <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Preferences
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(nextOpen) => {
        if (!nextOpen) dismiss();
      }} modal={false}>
        <SheetContent side="bottom" className="h-[auto] max-h-[92vh] rounded-t-[2rem] p-0 outline-none shadow-2xl border-t border-border/40" showCloseButton={true} overlayClassName="bg-transparent/0 backdrop-blur-none pointer-events-none">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted/40" />
          <div className="overflow-y-auto pb-safe">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) dismiss();
    }} modal={false}>
      <DialogContent className="sm:max-w-xl overflow-hidden p-2 gap-0 outline-none shadow-2xl border border-border/40 bg-background/95 backdrop-blur-sm" showCloseButton={true} overlayClassName="bg-transparent/0 backdrop-blur-none pointer-events-none">
        {content}
      </DialogContent>
    </Dialog>
  );
}
