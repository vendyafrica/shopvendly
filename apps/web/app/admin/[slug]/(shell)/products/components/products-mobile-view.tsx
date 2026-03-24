"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBag01Icon, Delete02Icon, Tick01Icon, CheckmarkCircle02Icon, Cancel01Icon, Share01Icon, PackageOpenIcon } from "@hugeicons/core-free-icons";
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
    const [activeTab, setActiveTab] = React.useState<"active" | "draft">("active");
    const isReadOnly = Boolean(bootstrap?.storeSlug === "vendly" && !bootstrap?.canWrite);

    if (isLoading) {
        return <ProductsMobileSkeleton />;
    }

    const storeName = bootstrap?.storeName || "My Store";
    const AdminHref = bootstrap?.storeSlug ? `/admin/${bootstrap.storeSlug}` : "/admin";

    const handleAddProduct = () => {
        if (isReadOnly) return;
        router.push(`${AdminHref}/products/new`);
    };

    const handleEditProduct = (id: string) => {
        router.push(`${AdminHref}/products/${id}`);
    };

    const clearSelection = () => {
        setSelectedIds({});
        setIsSelectionMode(false);
    };

    const publishProducts = async (items: ProductTableRow[]) => {
        if (isReadOnly || !onStatusChange || items.length === 0) return;
        await Promise.all(items.map((product) => onStatusChange(product.id, "active")));
        clearSelection();
    };

    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => {
            const next = { ...prev };
            if (next[id]) {
                delete next[id];
            } else {
                next[id] = true;
            }
            return next;
        });
    };

    const selectedProducts = rows.filter((product) => selectedIds[product.id]);
    const selectedCount = selectedProducts.length;

    const filteredRows = rows.filter((r) => {
        if (activeTab === "active") return r.status === "active";
        return r.status === "draft";
    });

    return (
        <div className="-mx-4 -mt-4 flex flex-col w-[calc(100%+2rem)] sm:hidden bg-white min-h-screen font-sans">
            {/* Refined Profile Header */}
            <div className="px-1 pt-6 pb-2 border-b border-slate-100 italic-style">
                <div className="flex items-center justify-between mb-6 px-5">
                    <div className="relative">
                        <div className="size-[88px] rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                            <StoreAvatar
                                storeName={storeName}
                                logoUrl={bootstrap?.storeLogoUrl}
                                size="lg"
                                shape="square"
                                className="size-[58px] rounded-[24px] border-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex justify-around items-center pl-6">
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">{rows.length}</span>
                            <span className="text-[13px] text-slate-500 font-medium">Products</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">
                                {rows.reduce((acc, r) => acc + (r.salesAmount || 0), 0)}
                            </span>
                            <span className="text-[13px] text-slate-500 font-medium">Sales</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-[18px] text-slate-900 leading-none mb-1">
                                {rows.filter(r => r.status === 'active').length}
                            </span>
                            <span className="text-[13px] text-slate-500 font-medium">Active</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-1 mb-6 px-5">
                    <h1 className="font-extrabold text-[16px] tracking-tight text-slate-900">{storeName}</h1>
                    <p className="text-[14px] text-slate-600 leading-[1.5] max-w-[95%]">
                        {bootstrap?.storeDescription || "Manage your product catalog and track sales performance in real-time."}
                    </p>
                    <Link
                        href={bootstrap?.storeSlug ? `https://${bootstrap.storeSlug}.shopvendly.com` : "#"}
                        target="_blank"
                        className="text-[14px] text-primary/90 font-bold hover:underline flex items-center gap-1 mt-1"
                    >
                        {bootstrap?.storeSlug ? `shopvendly.com/${bootstrap.storeSlug}` : "shopvendly.com"}
                        <HugeiconsIcon icon={Share01Icon} className="size-3.5" />
                    </Link>
                </div>

                <div className="flex gap-2.5 px-5 mb-6">
                    <Button
                        size="sm"
                        variant={isSelectionMode ? "default" : "outline"}
                        disabled={isReadOnly}
                        className={cn(
                            "flex-1 h-10 font-bold text-[13px] rounded-lg transition-all active:scale-[0.97]",
                            isSelectionMode ? "bg-slate-900 text-white" : "bg-slate-100 border-none text-slate-900 hover:bg-slate-200"
                        )}
                        onClick={() => {
                            if (isReadOnly) return;
                            if (isSelectionMode) clearSelection();
                            else setIsSelectionMode(true);
                        }}
                    >
                        {isReadOnly ? "Read only" : isSelectionMode ? "Done" : "Select Items"}
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 h-10 bg-primary/90 hover:bg-primary/80 text-white font-bold text-[13px] rounded-lg shadow-none border-none transition-all active:scale-[0.97]"
                        onClick={handleAddProduct}
                        disabled={isReadOnly}
                    >
                        <HugeiconsIcon icon={ShoppingBag01Icon} className="size-4" />
                        Add Product
                    </Button>
                </div>

                {/* Instagram Style Tabs */}
                <div className="flex w-full mt-2">
                    <button
                        onClick={() => setActiveTab("active")}
                        className={cn(
                            "flex-1 flex justify-center py-3 border-b-2 transition-colors",
                            activeTab === "active" ? "border-primary/70 text-primary/90" : "border-transparent text-slate-400"
                        )}
                    >
                        <HugeiconsIcon icon={ShoppingBag01Icon} className="size-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab("draft")}
                        className={cn(
                            "flex-1 flex justify-center py-3 border-b-2 transition-colors",
                            activeTab === "draft" ? "border-primary/70 text-primary/90" : "border-transparent text-slate-400"
                        )}
                    >
                        <HugeiconsIcon icon={PackageOpenIcon} className="size-6" />
                    </button>
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
                            disabled={isPublishing || isReadOnly}
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
                            disabled={isReadOnly}
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

            {/* Product List - Redesigned as Premium Cards */}
            <div className="flex flex-col gap-3 px-2 py-6 pb-20">
                {filteredRows.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center opacity-80 rounded-[32px] border-2 border-dashed border-border/40 bg-muted/5">
                        <div className="size-20 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center mb-5 bg-background shadow-sm">
                            <HugeiconsIcon icon={ShoppingBag01Icon} className="size-10 text-muted-foreground/40" />
                        </div>
                        <p className="font-bold text-foreground">No products found</p>
                        <p className="text-[13px] text-muted-foreground mt-1 px-8 text-balance">Your catalog is currently empty.</p>
                    </div>
                ) : (
                    filteredRows.map((product) => (
                        <div
                            key={product.id}
                            className={cn(
                                "group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:border-blue-200/50 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer relative overflow-hidden",
                                selectedIds[product.id] && "ring-2 ring-blue-500 ring-offset-2",
                                (isSelectionMode && product.status === "active") || isReadOnly ? "opacity-40" : "",
                                isSelectionMode && product.status === "active" && "pointer-events-none grayscale-[0.5]"
                            )}
                            onClick={() => {
                                if (isReadOnly) {
                                    handleEditProduct(product.id);
                                    return;
                                }
                                if (isSelectionMode && product.status !== "active") toggleSelected(product.id);
                                else handleEditProduct(product.id);
                            }}
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-[100%] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Image Section */}
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/10 shadow-sm">
                                <ProductThumbnail
                                    url={product.thumbnailUrl}
                                    name={product.name}
                                    contentType={product.thumbnailType}
                                />
                                {product.quantity === 0 && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Sold Out</span>
                                    </div>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <h4 className="font-bold text-sm text-foreground truncate group-hover:text-blue-700 transition-colors leading-tight capitalize">
                                    {product.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                        <HugeiconsIcon icon={ShoppingBag01Icon} className="size-2.5 opacity-50" />
                                        {product.salesAmount || 0} sales
                                    </span>
                                    {product.status !== "active" && (
                                        <span className={cn(
                                            "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide",
                                            product.status === "draft" ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"
                                        )}>
                                            {product.status}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Section */}
                            <div className="flex flex-col items-end shrink-0 gap-1.5">
                                <span className="font-bold text-[14px] text-foreground tracking-tight">
                                    {formatMoney(product.priceAmount, product.currency)}
                                </span>

                                {isSelectionMode && !isReadOnly ? (
                                    <div className={cn(
                                        "size-5 rounded-full border-2 flex items-center justify-center transition-all",
                                        selectedIds[product.id] ? "bg-blue-600 border-blue-600 text-white scale-110" : "border-slate-300"
                                    )}>
                                        {selectedIds[product.id] && <HugeiconsIcon icon={Tick01Icon} className="size-3" />}
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="p-1 px-4 ml-3 rounded-lg text-rose-500 active:scale-90 transition-transform hover:bg-rose-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isReadOnly) return;
                                            if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                                onDelete(product.id);
                                            }
                                        }}
                                        disabled={isReadOnly}
                                    >
                                        <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                                    </button>
                                )}
                            </div>

                            {statusUpdatingProductId === product.id && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs animate-pulse">
                                        Updating...
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}