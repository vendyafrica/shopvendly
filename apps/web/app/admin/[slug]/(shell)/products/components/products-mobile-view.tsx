"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@shopvendly/ui/components/button";
import {
    Sheet,
    SheetContent
} from "@shopvendly/ui/components/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import type { ProductTableRow } from "@/features/products/hooks/use-products";
import type { TenantBootstrap } from "@/app/admin/context/tenant-context";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shopvendly/ui/components/select";
import { isLikelyVideoMedia } from "@/utils/misc";
import { useRouter } from "next/navigation";
import { StoreAvatar } from "@/components/store-avatar";

const STATUS_STYLES: Record<ProductTableRow["status"], { label: string; badgeClass: string }> = {
    draft: { label: "Draft", badgeClass: "bg-muted text-muted-foreground border-dashed" },
    ready: { label: "Ready", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
    active: { label: "Active", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    "sold-out": { label: "Sold out", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
};

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
                className="h-full w-full object-cover"
                muted
                playsInline
                loop
                autoPlay
            />
        );
    }

    return (
        <Image
            src={url}
            alt={name}
            fill
            className="object-cover"
            unoptimized={url.includes(".ufs.sh")}
            onError={() => setForceVideo(true)}
        />
    );
}

interface ProductsMobileViewProps {
    bootstrap: TenantBootstrap | null;
    rows: ProductTableRow[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onAddSelect: (mode: "single" | "multiple") => void;
    onStatusChange?: (productId: string, newStatus: ProductTableRow["status"]) => void;
    isPublishing?: boolean;
}

export function ProductsMobileView({
    bootstrap,
    rows,
    onEdit,
    onDelete,
    onAddSelect,
    onStatusChange,
}: ProductsMobileViewProps) {
    const [selectedProduct, setSelectedProduct] = React.useState<ProductTableRow | null>(null);
    const [sheetOpen, setSheetOpen] = React.useState(false);

    const totalProducts = rows.length;
    const activeCount = rows.filter((p) => p.status === "active" || p.status === "ready").length;
    const draftCount = rows.filter((p) => p.status === "draft").length;

    const handleProductClick = (product: ProductTableRow) => {
        setSelectedProduct(product);
        setSheetOpen(true);
    };

    const storeName = bootstrap?.storeName || "My Store";
    const AdminHref = bootstrap?.storeSlug ? `/admin/${bootstrap.storeSlug}` : "/admin";
    const router = useRouter();

    return (
        <div className="flex flex-col pb-20 w-full max-w-full overflow-hidden sm:hidden">
            {/* Header Profile Section */}
            <div className="px-5 py-6">
                <div className="flex items-center gap-6 mb-5">
                    <StoreAvatar
                        storeName={storeName}
                        logoUrl={bootstrap?.storeLogoUrl}
                        size="lg"
                        className="size-[84px] shrink-0 border border-border rounded-[32px]"
                    />

                    <div className="flex-1 flex justify-between items-center text-center">
                        <div className="flex flex-col items-center flex-1">
                            <span className="font-semibold text-xl tracking-tight">{totalProducts}</span>
                            <span className="text-[11px] font-medium text-foreground tracking-wide uppercase mt-0.5">Products</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                            <span className="font-semibold text-xl tracking-tight">{activeCount}</span>
                            <span className="text-[11px] font-medium text-foreground tracking-wide uppercase mt-0.5">Active</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                            <span className="font-semibold text-xl tracking-tight">{draftCount}</span>
                            <span className="text-[11px] font-medium text-foreground tracking-wide uppercase mt-0.5">Drafts</span>
                        </div>
                    </div>
                </div>

                <div className="mb-5 px-0.5">
                    <h2 className="font-bold text-sm tracking-tight">{storeName}</h2>
                    <p className="text-[13px] text-foreground/80 mt-1 leading-snug whitespace-pre-line text-balance">
                        Manage your catalog from anywhere.
                    </p>
                </div>

                <div className="flex gap-2 w-full">
                    <Button
                        className="flex-1 rounded-md font-semibold text-xs"
                        variant="default"
                        size="sm"
                        onClick={() => onAddSelect("single")}
                    >
                        Add Product
                    </Button>
                    <Button
                        className="flex-1 rounded-md font-semibold text-xs"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(AdminHref)}
                    >
                        Admin
                    </Button>
                </div>
            </div>

            {/* Grid tabs */}
            <div className="flex w-full items-center justify-center border-b pt-3">
                <div className="flex items-center gap-2 border-b-2 border-primary pb-3 px-8 text-sm font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                    <span className="sr-only">Grid</span>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-px">
                {rows.length === 0 ? (
                    <div className="col-span-3 py-16 flex flex-col items-center justify-center text-center text-muted-foreground px-4">
                        <div className="size-12 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 opacity-50"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                        </div>
                        <p className="text-sm font-medium text-foreground">No Products Yet</p>
                        <p className="text-sm mt-1">Tap Add Product to create one.</p>
                    </div>
                ) : (
                    rows.map((product) => (
                        <button
                            key={product.id}
                            className="relative aspect-square focus:outline-none overflow-hidden group"
                            onClick={() => handleProductClick(product)}
                        >
                            <ProductThumbnail
                                url={product.thumbnailUrl}
                                name={product.name}
                                contentType={product.thumbnailType}
                            />
                            {/* Overlay for status */}
                            {product.status !== 'active' && (
                                <div className="absolute top-1 right-1">
                                    <div className={`size-2.5 rounded-full border border-background shadow-sm ${product.status === 'draft' ? 'bg-muted-foreground' :
                                        product.status === 'ready' ? 'bg-amber-400' :
                                            product.status === 'sold-out' ? 'bg-rose-500' : 'bg-transparent'
                                        }`} />
                                </div>
                            )}
                            {/* Overlay for low stock */}
                            {product.quantity === 0 && (
                                <div className="absolute inset-x-0 bottom-0 bg-background/50 flex flex-col items-center justify-center backdrop-blur-[1px] py-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Out of stock</span>
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>

            {/* Bottom Sheet for Product Actions */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-[20px] px-0 pb-8 pt-3 max-h-[90vh] flex flex-col">
                    <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-6 shrink-0" />
                    {selectedProduct && (
                        <div className="flex flex-col overflow-y-auto px-1">
                            <div className="px-5 flex items-start gap-4 mb-8">
                                <div className="relative size-[72px] rounded-lg overflow-hidden bg-muted shrink-0 border border-border shadow-sm">
                                    <ProductThumbnail
                                        url={selectedProduct.thumbnailUrl}
                                        name={selectedProduct.name}
                                        contentType={selectedProduct.thumbnailType}
                                    />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                                    <h3 className="font-semibold text-base leading-snug truncate">{selectedProduct.name}</h3>
                                    <p className="text-sm font-medium mt-1 mb-2 text-foreground">{formatMoney(selectedProduct.priceAmount, selectedProduct.currency)}</p>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={selectedProduct.status}
                                            onValueChange={(value) => {
                                                if (!value) return;
                                                if (onStatusChange) {
                                                    onStatusChange(selectedProduct.id, value);
                                                }
                                                // Optimistic local update for the sheet
                                                setSelectedProduct(prev => prev ? { ...prev, status: value as ProductTableRow["status"] } : null);
                                            }}
                                        >
                                            <SelectTrigger className={`h-6 w-[90px] px-2 py-0 text-[10px] font-medium border ${STATUS_STYLES[selectedProduct.status].badgeClass} focus:ring-0 focus:ring-offset-0 bg-transparent`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(STATUS_STYLES).map(([key, style]) => (
                                                    <SelectItem key={key} value={key} className="text-[10px] font-medium min-h-6 py-1">
                                                        {style.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-[11px] text-muted-foreground font-medium">{selectedProduct.quantity} in stock</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col px-4 gap-2">
                                <Button
                                    variant="secondary"
                                    className="justify-start gap-3 h-[52px] text-sm font-semibold rounded-xl bg-muted/60 hover:bg-muted/80"
                                    onClick={() => {
                                        setSheetOpen(false);
                                        onEdit(selectedProduct.id);
                                    }}
                                >
                                    <HugeiconsIcon icon={Edit02Icon} className="size-[20px] text-foreground" />
                                    Edit Product
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="justify-start gap-3 h-[52px] text-sm font-semibold rounded-xl text-destructive bg-destructive/5 hover:bg-destructive/10"
                                    onClick={() => {
                                        setSheetOpen(false);
                                        setTimeout(() => onDelete(selectedProduct.id), 250);
                                    }}
                                >
                                    <HugeiconsIcon icon={Delete02Icon} className="size-[20px]" />
                                    Delete Product
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
