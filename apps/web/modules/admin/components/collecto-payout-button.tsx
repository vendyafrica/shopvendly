"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Invoice01Icon, Loading03Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { toast } from "sonner";
import { cn } from "@shopvendly/ui/lib/utils";

interface CollectoBalance {
  availableBalance: number;
  payoutAmount: number;
  payoutFee: number;
  orderCount: number;
}

export function CollectoPayoutButton({ className }: { className?: string }) {
  const { bootstrap } = useTenant();
  const [balance, setBalance] = React.useState<CollectoBalance | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(true);

  const storeId = bootstrap?.storeId;
  const isManualMode = bootstrap?.collectoPayoutMode === "manual_batch";

  const fetchBalance = React.useCallback(async () => {
    if (!storeId) return;
    try {
      const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}/collecto/available-balance`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    } finally {
      setIsFetching(false);
    }
  }, [storeId]);

  React.useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const onPayout = async () => {
    if (!storeId || !balance || balance.availableBalance <= 0) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}/collecto/initiate-payout`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to initiate payout");
      }

      toast.success("Payout initiated successfully", {
        description: `Your payout of ${new Intl.NumberFormat("en-US", { style: "currency", currency: bootstrap?.defaultCurrency || "UGX" }).format(balance.availableBalance)} is being processed.`,
      });
      
      // Refresh balance
      await fetchBalance();
    } catch (err: any) {
      toast.error("Payout failed", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isManualMode) return null;

  const canPayout = (balance?.availableBalance ?? 0) > 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {balance && balance.availableBalance > 0 && (
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none">Available for Payout</span>
          <span className="text-sm font-bold text-emerald-600">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: bootstrap?.defaultCurrency || "UGX" }).format(balance.availableBalance)}
          </span>
        </div>
      )}
      <Button
        onClick={onPayout}
        disabled={isLoading || !canPayout || isFetching}
        className={cn(
          "h-10 rounded-xl px-6 font-bold shadow-lg transition-all active:scale-95",
          canPayout 
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20" 
            : "bg-muted text-muted-foreground shadow-none"
        )}
      >
        {isLoading ? (
          <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <HugeiconsIcon icon={Invoice01Icon} className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Processing..." : "Request Payout"}
      </Button>
    </div>
  );
}
