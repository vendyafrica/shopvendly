"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBag01Icon, Delete02Icon, Tick01Icon, CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ProductTableRow } from "@/modules/products/hooks/use-products";
import { type TenantBootstrap } from "@/modules/admin/context";
import { isLikelyVideoMedia } from "@/utils/misc";
import { useRouter } from "next/navigation";
import { StoreAvatar } from "@/components/store-avatar";
import { cn } from "@shopvendly/ui/lib/utils";

function formatMoney(amount: number, currency: string) {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
    }).format(amount);
}

function ProductThumbnail({
    url,
    name,
    contentType,
}: {
    url?: string;
    name: string;
    contentType?: string;
}) {
    const [forceVideo, setForceVideo] = React.useState(false);

    if (!url) {
        return (
            <div className="flex size-full items-center justify-center bg-muted/50 border border-border/50 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 opacity-30"><path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9" /><path d="M9 22V12h6v10M2 10.6L12 2l10 8.6" /></svg>
            </div>
        );
    }

    const isVideo = forceVideo || isLikelyVideoMedia({ url, contentType });

    if (isVideo) {
        return (
            <video
                src={url}
                className="h-full w-full object-cover bg-neutral-100"
                muted
                playsInline
                loop
                autoPlay
                preload="none"
            />
        );
    }

    return (
        <Image
            src={url}
            alt={name}
            fill
            sizes="(max-width: 640px) 33vw, 128px"
            className="object-cover bg-neutral-100"
            unoptimized={url.includes(".ufs.sh")}
            onError={() => setForceVideo(true)}
            loading="eager"
            priority={false}
        />
    );
}

// ─── Mobile skeleton ────────────────────────────────────────────────────────
function ProductsMobileSkeleton() {
    return (
        <div className="flex flex-col pb-20 w-full max-w-full overflow-hidden sm:hidden bg-slate-50/50 min-h-screen font-sans">
            {/* Minimal Header Skeleton */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-3 py-3 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-md bg-neutral-200 animate-pulse" />
                    <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-neutral-200 rounded-md animate-pulse" />
            </div>

            {/* Product Grid Skeleton (2 columns) */}
            <div className="grid grid-cols-2 gap-3 px-3 py-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col overflow-hidden rounded-md border border-border/40 bg-white shadow-sm">
                        <div className="aspect-square w-full bg-neutral-200 animate-pulse" />
                        <div className="p-3 space-y-2">
                            <div className="h-3 w-3/4 bg-neutral-200 rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-neutral-200 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface ProductsMobileViewProps {
    bootstrap: TenantBootstrap | null;
    rows: ProductTableRow[];
    isLoading?: boolean;
    onDelete: (id: string) => void;
    onStatusChange?: (productId: string, newStatus: ProductTableRow["status"]) => void;
    statusUpdatingProductId?: string | null;
    isPublishing?: boolean;
}

export function ProductsMobileView({
    bootstrap,
    rows,
    onDelete,
    onStatusChange,
    statusUpdatingProductId,
    isPublishing = false,
    isLoading = false,
}: ProductsMobileViewProps) {

    const router = useRouter();
    const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({});
    const [isSelectionMode, setIsSelectionMode] = React.useState(false);

    if (isLoading) {
        return <ProductsMobileSkeleton />;
    }

    const storeName = bootstrap?.storeName || "My Store";
    const AdminHref = bootstrap?.storeSlug ? `/admin/${bootstrap.storeSlug}` : "/admin";

    const handleAddProduct = () => {
        router.push(`${AdminHref}/products/new`);
    };

    const handleEditProduct = (id: string) => {
        router.push(`${AdminHref}/products/${id}`);
    };

    const selectedCount = Object.values(selectedIds).filter(Boolean).length;

    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const clearSelection = () => {
        setSelectedIds({});
        setIsSelectionMode(false);
    };

    const isProductSelectable = (product: ProductTableRow) => product.status !== "active";

    const publishProducts = async (items: ProductTableRow[]) => {
        if (!onStatusChange || items.length === 0) return;
        await Promise.all(items.map((product) => onStatusChange(product.id, "active")));
        clearSelection();
    };

    const selectedProducts = rows.filter((product) => selectedIds[product.id]);

    return (
        <div className="flex flex-col pb-20 w-full max-w-full overflow-hidden sm:hidden bg-slate-50/50 min-h-screen font-sans">
            {/* Elegant Header */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-3 py-3 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <StoreAvatar
                        storeName={storeName}
                        logoUrl={bootstrap?.storeLogoUrl}
                        size="sm"
                        className="size-8 border border-slate-200 rounded-md bg-slate-50 shadow-sm"
                    />
                    <h1 className="font-semibold text-[15px] tracking-tight text-slate-800 truncate max-w-[150px]">{storeName}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant={isSelectionMode ? "default" : "outline"}
                        className={cn(
                             "h-8 gap-1.5 font-medium text-[13px] rounded-md px-4 shadow-sm active:scale-95 transition-all",
                             isSelectionMode ? "bg-slate-900 text-white hover:bg-slate-800" : "hover:bg-slate-50"
                        )}
                        onClick={() => {
                            if (isSelectionMode) clearSelection();
                            else setIsSelectionMode(true);
                        }}
                        disabled={rows.length === 0}
                    >
                        {isSelectionMode ? "Done" : "Select"}
                    </Button>

                    <Button
                        size="sm"
                        className="h-8 gap-1.5 hover:bg-slate-800 text-white font-medium text-[13px] rounded-md px-5 shadow-sm active:scale-95 transition-all"
                        onClick={handleAddProduct}
                    >
                        <HugeiconsIcon icon={ShoppingBag01Icon} className="size-3.5" />
                        Add
                    </Button>
                </div>
            </div>

            {selectedCount > 0 && (
                <div className="mx-3 mb-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                         <span className="font-semibold text-slate-900">{selectedCount}</span>
                         <span className="text-slate-500">selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            type="button" 
                            onClick={() => void publishProducts(selectedProducts)}
                            className="font-medium text-primary flex items-center gap-1 active:scale-95 transition-transform"
                            disabled={isPublishing}
                        >
                            <HugeiconsIcon icon={Tick01Icon} className="size-3" />
                            Publish
                        </button>
                        <button 
                            type="button" 
                            onClick={() => {
                                if (confirm(`Delete ${selectedCount} items?`)) {
                                    selectedProducts.forEach(p => onDelete(p.id));
                                    clearSelection();
                                }
                            }}
                            className="font-medium text-rose-500 flex items-center gap-1 active:scale-95 transition-transform"
                        >
                            <HugeiconsIcon icon={Delete02Icon} className="size-3" />
                            Delete
                        </button>
                        <div className="w-px h-3 bg-slate-200 mx-1" />
                        <button type="button" onClick={clearSelection} className="font-medium text-slate-400">
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Product Grid (2 columns) - Starting immediately */}
            <div className="grid grid-cols-2 gap-3 px-3 py-4 pb-12">
                {rows.length === 0 ? (
                    <div className="col-span-2 py-20 flex flex-col items-center justify-center text-center text-muted-foreground bg-white rounded-md border border-dashed border-border/60 shadow-sm">
                        <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <HugeiconsIcon icon={ShoppingBag01Icon} className="size-8 opacity-40" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">No products found</p>
                        <p className="text-xs mt-1 text-muted-foreground px-8 text-balance">Your catalog is empty.</p>
                    </div>
                ) : (
                    rows.map((product) => (
                        <div
                            key={product.id}
                            className={cn(
                                "group flex flex-col overflow-hidden rounded-md border border-border/50 bg-white shadow-sm transition-all active:scale-[0.98] hover:shadow-md cursor-pointer",
                                selectedIds[product.id] && "ring-2 ring-primary ring-offset-2",
                                isSelectionMode && product.status === "active" && "opacity-40 pointer-events-none grayscale-[0.5]"
                            )}
                             onClick={() => {
                                 if (isSelectionMode && product.status !== "active") toggleSelected(product.id);
                                 else handleEditProduct(product.id);
                             }}
                        >
                            <div className="relative aspect-square w-full overflow-hidden bg-muted/10 border-b border-border/30">
                                { (isSelectionMode || selectedIds[product.id] || product.status === "active") && (
                                     <div className="absolute left-2 top-2 z-10 rounded-full p-1.5">
                                         {product.status === "active" ? (
                                              <div className="rounded-full bg-white/90 p-1.5 shadow-sm opacity-60">
                                                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-emerald-500" />
                                              </div>
                                         ) : (
                                              <div className={cn(
                                                  "rounded-full p-1.5 shadow-sm transition-all",
                                                  selectedIds[product.id] ? "bg-primary text-white scale-110" : "bg-white/90 text-rose-500"
                                              )}>
                                                  <HugeiconsIcon 
                                                      icon={selectedIds[product.id] ? CheckmarkCircle02Icon : Cancel01Icon} 
                                                      className="size-4" 
                                                  />
                                              </div>
                                         )}
                                     </div>
                                )}
                                <ProductThumbnail
                                    url={product.thumbnailUrl}
                                    name={product.name}
                                    contentType={product.thumbnailType}
                                />

                                {/* Absolute Overlays */}
                                {(product.status !== "active" && product.status !== "ready") && (
                                    <div className="absolute top-2 right-2">
                                        <div className="px-1.5 py-0.5 rounded bg-white/90 text-slate-600 text-[10px] font-medium shadow-sm backdrop-blur-md border border-black/5">
                                            {product.status === "draft" ? "Draft" : product.status}
                                        </div>
                                    </div>
                                )}

                                {product.quantity === 0 && (
                                    <div className="absolute bottom-2 left-2">
                                        <div className="px-1.5 py-0.5 rounded bg-rose-500/95 text-white text-[10px] font-medium shadow-sm backdrop-blur-md">
                                            Out of stock
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-white flex flex-col gap-1">
                                <h3 className="font-medium text-[13px] leading-tight capitalize truncate text-slate-800">{product.name}</h3>
                                <div className="flex items-center justify-between">
                                    <div className="text-[13px] font-semibold text-slate-900">
                                        {formatMoney(product.priceAmount, product.currency)}
                                    </div>
                                    {!isSelectionMode && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                className="size-7 rounded-full text-primary hover:bg-primary/10 active:bg-primary/15 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void publishProducts([product]);
                                                }}
                                                disabled={isPublishing || product.status === "active"}
                                            >
                                                <HugeiconsIcon icon={Tick01Icon} className="size-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                className="size-7 rounded-full text-rose-500 hover:bg-rose-50 active:bg-rose-100 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                                        onDelete(product.id);
                                                    }
                                                }}
                                            >
                                                <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {statusUpdatingProductId === product.id && (
                                    <p className="text-[11px] text-primary font-medium">Publishing...</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}