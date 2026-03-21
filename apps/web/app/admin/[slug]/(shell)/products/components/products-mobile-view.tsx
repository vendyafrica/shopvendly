"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@shopvendly/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import type { ProductTableRow } from "@/modules/products/hooks/use-products";
import { type TenantBootstrap } from "@/modules/admin/context";
import { isLikelyVideoMedia } from "@/utils/misc";
import { cn } from "@shopvendly/ui/lib/utils";
import { useRouter } from "next/navigation";
import { StoreAvatar } from "@/components/store-avatar";

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
            <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 bg-white border-b border-border/40">
                <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-neutral-200 animate-pulse" />
                    <div className="h-3 w-20 bg-neutral-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-neutral-200 rounded-lg animate-pulse" />
            </div>

            {/* Product Grid Skeleton (2 columns) */}
            <div className="grid grid-cols-2 gap-2.5 px-3 py-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col overflow-hidden rounded-[1.75rem] border border-border/40 bg-white shadow-sm">
                        <div className="aspect-[1/1.1] w-full bg-neutral-200 animate-pulse" />
                        <div className="p-3.5 space-y-2">
                            <div className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
                            <div className="flex justify-between items-center">
                                <div className="h-2 w-1/3 bg-neutral-50 rounded animate-pulse" />
                                <div className="h-4 w-8 bg-neutral-100 rounded-full animate-pulse" />
                            </div>
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
    onEdit?: (id: string) => void;
    onDelete: (id: string) => void;
    onAddSelect?: (mode: "single" | "multiple") => void;
    onStatusChange?: (productId: string, newStatus: ProductTableRow["status"]) => void;
    statusUpdatingProductId?: string | null;
    isPublishing?: boolean;
}

export function ProductsMobileView({
    bootstrap,
    rows,
    isLoading = false,
    onStatusChange,
    statusUpdatingProductId,
    isPublishing = false,
    onDelete,
}: ProductsMobileViewProps) {

    const router = useRouter();

    if (isLoading) {
        return <ProductsMobileSkeleton />;
    }

    const totalProducts = rows.length;
    const activeCount = rows.filter((p) => p.status === "active" || p.status === "ready").length;
    const draftCount = rows.filter((p) => p.status === "draft").length;


    const storeName = bootstrap?.storeName || "My Store";
    const AdminHref = bootstrap?.storeSlug ? `/admin/${bootstrap.storeSlug}` : "/admin";

    const handleAddProduct = () => {
        router.push(`${AdminHref}/products/new`);
    };

    const handleEditProduct = (id: string) => {
        router.push(`${AdminHref}/products/${id}`);
    };

    return (
        <div className="flex flex-col pb-20 w-full max-w-full overflow-hidden sm:hidden bg-slate-50/50 min-h-screen font-sans">
            {/* Ultra-Minimal Header */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 bg-white/80 backdrop-blur-xl border-b border-border/40">
                <div className="flex items-center gap-2.5">
                    <StoreAvatar
                        storeName={storeName}
                        logoUrl={bootstrap?.storeLogoUrl}
                        size="sm"
                        className="size-7 border border-border/60 rounded-lg bg-muted/20"
                    />
                    <h1 className="font-black text-xs tracking-[0.1em] uppercase truncate max-w-[120px]">{storeName}</h1>
                </div>

                <Button
                    size="sm"
                    className="h-8 gap-1 bg-foreground text-background font-black text-[10px] rounded-lg px-3 uppercase tracking-wider active:scale-95 transition-all"
                    onClick={handleAddProduct}
                >
                    <HugeiconsIcon icon={ShoppingBag01Icon} className="size-3" />
                    Add
                </Button>
            </div>

            {/* Product Grid (2 columns) - Starting immediately */}
            <div className="grid grid-cols-2 gap-2.5 px-3 py-4 pb-12">
                {rows.length === 0 ? (
                    <div className="col-span-2 py-20 flex flex-col items-center justify-center text-center text-muted-foreground bg-white rounded-[2rem] border border-dashed border-border/60 shadow-inner">
                        <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-5 animate-pulse">
                            <HugeiconsIcon icon={ShoppingBag01Icon} className="size-10 opacity-20" />
                        </div>
                        <p className="text-sm font-black text-foreground uppercase tracking-widest">No products found</p>
                        <p className="text-[11px] mt-2 font-medium opacity-60 px-8 text-balance">Your catalog is empty. Start adding products to see them here.</p>
                    </div>
                ) : (
                    rows.map((product) => (
                        <div
                            key={product.id}
                            className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-border/50 bg-white shadow-sm transition-all active:scale-[0.97] hover:shadow-md cursor-pointer"
                            onClick={() => handleEditProduct(product.id)}
                        >
                            <div className="relative aspect-[1/1.1] w-full overflow-hidden bg-muted/10">
                                <ProductThumbnail
                                    url={product.thumbnailUrl}
                                    name={product.name}
                                    contentType={product.thumbnailType}
                                />

                                {/* Absolute Overlays */}
                                <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
                                    <div className={cn(
                                        "px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-tighter border shadow-lg backdrop-blur-md",
                                        product.status === "ready"
                                            ? "bg-emerald-500 text-white border-emerald-400"
                                            : "bg-white text-slate-700 border-white/50"
                                    )}>
                                        {product.status === "ready" ? "Live" : "Draft"}
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg bg-black/85 text-white text-[10px] font-semibold shadow-lg backdrop-blur-md border border-white/10">
                                        {formatMoney(product.priceAmount, product.currency)}
                                    </div>
                                </div>

                                {product.quantity <= 5 && (
                                    <div className="absolute bottom-2.5 left-2.5">
                                        <div className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[9px] font-semibold uppercase tracking-widest shadow-xl border border-rose-400/50">
                                            {product.quantity === 0 ? "OUT" : `LOW: ${product.quantity}`}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 pt-3.5 bg-gradient-to-b from-white to-slate-50/30">
                                <h3 className="font-semibold text-[13px] leading-tight tracking-tight truncate mb-1.5 text-slate-800">{product.name}</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{product.category || "General"}</span>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/50">
                                        <span className="text-[10px] font-semibold text-slate-900">{product.salesAmount || 0}</span>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">SOLD</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}