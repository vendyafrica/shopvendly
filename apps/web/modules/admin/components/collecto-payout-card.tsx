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
      "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6 shadow-sm",
      className
    )}>
      <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none text-emerald-500">
        <HugeiconsIcon icon={Invoice01Icon} size={120} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">Manual Payout Ready</span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-3xl font-bold tracking-tight text-foreground">
              {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(balance?.availableBalance ?? 0)}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              Manual payout mode is active. Customer collections stay ready until you trigger seller payout yourself.
            </p>
          </div>
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100/70 bg-white/70 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Orders Waiting</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{balance?.orderCount ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100/70 bg-white/70 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Payout After Fee</p>
            <p className="mt-2 text-lg font-bold text-foreground">
              {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(balance?.payoutAmount ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100/70 bg-white/70 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Estimated Fee</p>
            <p className="mt-2 text-lg font-bold text-foreground">
              {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(balance?.payoutFee ?? 0)}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onPayout}
            disabled={isLoading || !hasBalance}
            className={cn(
              "h-11 rounded-xl px-8 font-bold shadow-lg transition-all active:scale-[0.98]",
              hasBalance
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                : "bg-muted text-muted-foreground shadow-none"
            )}
          >
            {isLoading ? (
              <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <HugeiconsIcon icon={Invoice01Icon} className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Triggering payout..." : hasBalance ? "Trigger Manual Payout" : "No Funds Available"}
          </Button>
        </div>
      </div>
    </div>
  );
}
