"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Invoice01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { useTenant } from "@/modules/admin/context/tenant-context";
import { toast } from "sonner";
import { cn } from "@shopvendly/ui/lib/utils";

interface CollectoBalance {
  availableBalance: number;
  totalOwedBalance: number;
  payoutAmount: number;
  payoutFee: number;
  orderCount: number;
}

export function CollectoPayoutCard({ className }: { className?: string }) {
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
      
      await fetchBalance();
    } catch (err) {
      toast.error("Payout failed", {
        description: err instanceof Error ? err.message : "Something went wrong while triggering payout.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isManualMode || isFetching) return null;

  const hasBalance = (balance?.availableBalance ?? 0) > 0;
  const currency = bootstrap?.defaultCurrency || "UGX";

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 to-transparent px-5 py-4 shadow-sm",
      className
    )}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">Manual Payout</span>
          </div>

          <div className="hidden sm:flex items-center gap-5 text-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Total Earned</span>
              <span className="font-bold text-foreground">
                {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(balance?.totalOwedBalance ?? 0)}
              </span>
            </div>
            <div className="h-4 w-px bg-border/60 mt-2" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">Available</span>
              <span className="font-bold text-emerald-600">
                {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(balance?.availableBalance ?? 0)}
              </span>
            </div>
            <div className="h-4 w-px bg-border/60 mt-2" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Orders</span>
              <span className="font-bold text-foreground">{balance?.orderCount ?? 0}</span>
            </div>
          </div>

          <div className="flex sm:hidden flex-col text-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Balance</span>
            <span className="font-bold text-foreground">
              {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(balance?.totalOwedBalance ?? 0)}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">
              {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(balance?.availableBalance ?? 0)} available
            </span>
          </div>
        </div>

        <Button
          onClick={onPayout}
          disabled={isLoading || !hasBalance}
          size="sm"
          className={cn(
            "h-9 shrink-0 rounded-xl px-5 text-xs font-bold shadow-sm transition-all active:scale-[0.98]",
            hasBalance
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
              : "bg-muted text-muted-foreground shadow-none"
          )}
        >
          {isLoading ? (
            <HugeiconsIcon icon={Loading03Icon} className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <HugeiconsIcon icon={Invoice01Icon} className="mr-1.5 h-3.5 w-3.5" />
          )}
          {isLoading ? "Processing..." : hasBalance ? "Trigger Payout" : "No Funds"}
        </Button>
      </div>
    </div>
  );
}
