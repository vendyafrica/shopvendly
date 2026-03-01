"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@shopvendly/ui/lib/utils";
import { UploadModal } from "@/app/admin/[slug]/(shell)/products/components/upload-modal";
import { useTenant } from "@/app/admin/context/tenant-context";
import { useInvalidateProducts } from "@/features/products/hooks/use-products";

interface QuickAddLauncherProps {
  tenantId?: string;
  className?: string;
  label?: string;
}

export function QuickAddLauncher({ tenantId: tenantIdProp, className, label = "Add product" }: QuickAddLauncherProps) {
  const { bootstrap } = useTenant();
  const tenantId = tenantIdProp || bootstrap?.tenantId || "";
  const storeId = bootstrap?.storeId;
  const { invalidate } = useInvalidateProducts();

  const [open, setOpen] = React.useState(false);

  const handleCreate = React.useCallback(
    (data: { productName: string; description: string; priceAmount: number; currency: string; quantity: number }, media: { url: string; pathname: string; contentType: string }[]) => {
      if (!tenantId || !storeId) {
        alert("Store not ready. Please refresh.");
        return;
      }
      void (async () => {
        try {
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storeId,
              title: data.productName,
              description: data.description,
              priceAmount: data.priceAmount,
              currency: data.currency,
              quantity: data.quantity,
              source: "quick-add",
              status: "ready",
              media,
            }),
          });
          if (!res.ok) throw new Error("Failed to create product");
          await invalidate(storeId);
        } catch (e) {
          console.error(e);
          alert("Could not create product. Please try again.");
        } finally {
          setOpen(false);
        }
      })();
    },
    [invalidate, storeId, tenantId]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-3 rounded-xl border bg-card/80 px-4 py-3 shadow-sm transition hover:bg-muted/60",
          className
        )}
      >
        <HugeiconsIcon icon={Add01Icon} className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{label}</span>
      </button>

      {tenantId && storeId ? (
        <UploadModal
          open={open}
          onOpenChange={setOpen}
          tenantId={tenantId}
          onCreate={handleCreate}
          mode="single"
        />
      ) : null}
    </>
  );
}
