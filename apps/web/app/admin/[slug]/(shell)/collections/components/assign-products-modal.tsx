"use client";

import * as React from "react";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@shopvendly/ui/components/dialog";
import { Button } from "@shopvendly/ui/components/button";
import { Checkbox } from "@shopvendly/ui/components/checkbox";
import { Input } from "@shopvendly/ui/components/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Search01Icon } from "@hugeicons/core-free-icons";

interface ProductRow {
    id: string;
    productName: string;
    thumbnailUrl?: string | null;
    thumbnailType?: string | null;
}

interface AssignProductsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    collectionId: string | null;
    collectionName?: string;
    products: ProductRow[];
    productsLoading?: boolean;
    productsError?: string | null;
    initialSelectedProductIds: Set<string>;
    onSave: (collectionId: string, productIds: string[]) => Promise<void>;
}

export function AssignProductsModal({
    open,
    onOpenChange,
    collectionId,
    collectionName,
    products,
    productsLoading = false,
    productsError = null,
    initialSelectedProductIds,
    onSave,
}: AssignProductsModalProps) {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [search, setSearch] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const searchInputRef = React.useRef<HTMLInputElement | null>(null);

    const renderThumbnail = (product: ProductRow) => {
        if (!product.thumbnailUrl) {
            return <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground">N/A</div>;
        }

        const isVideo = product.thumbnailType?.startsWith("video/") ?? false;

        if (isVideo) {
            return (
                <video
                    src={product.thumbnailUrl}
                    className="size-12 rounded-lg object-cover bg-muted"
                    muted
                    playsInline
                    preload="none"
                />
            );
        }

        return (
            <div className="relative size-12 overflow-hidden rounded-lg bg-muted">
                <Image
                    src={product.thumbnailUrl}
                    alt={product.productName}
                    fill
                    className="object-cover"
                    unoptimized={product.thumbnailUrl.includes(".ufs.sh")}
                    sizes="48px"
                />
            </div>
        );
    };

    React.useEffect(() => {
        if (open) {
            setSelectedIds(new Set(initialSelectedProductIds));
            setSearch("");

            if (typeof window !== "undefined" && window.innerWidth < 768) {
                window.requestAnimationFrame(() => {
                    searchInputRef.current?.blur();
                });
            }
        }
    }, [open, initialSelectedProductIds]);

    const handleToggle = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleToggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(products.map(p => p.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSave = async () => {
        if (!collectionId) return;
        setSaving(true);
        try {
            await onSave(collectionId, Array.from(selectedIds));
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    const filteredProducts = React.useMemo(() => {
        if (!search.trim()) return products;
        const q = search.toLowerCase();
        return products.filter((p) => p.productName.toLowerCase().includes(q));
    }, [products, search]);

    const isAllSelected = products.length > 0 && selectedIds.size === products.length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 flex flex-col sm:max-h-[85vh] h-[90vh] sm:h-[70vh] rounded-2xl overflow-hidden">
                <div className="border-b px-6 py-4 bg-linear-to-r from-muted/40 to-background">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            Assign to {collectionName || "Collection"}
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="p-4 border-b bg-muted/20">
                    <div className="relative">
                        <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {productsLoading ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            Loading products...
                        </div>
                    ) : productsError ? (
                        <div className="p-8 text-center text-sm text-destructive">
                            Failed to load products.
                        </div>
                    ) : products.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No products found in your catalog.
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No products match your search.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <label className="flex items-center gap-3 rounded-md p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-transparent">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={(c) => handleToggleAll(Boolean(c))}
                                />
                                <span className="text-sm font-medium">Select All</span>
                            </label>

                            {filteredProducts.map((product) => (
                                <label key={product.id} className="flex items-center gap-3 rounded-xl border border-transparent p-3 hover:border-border/60 hover:bg-muted/40 cursor-pointer transition-colors">
                                    <Checkbox
                                        checked={selectedIds.has(product.id)}
                                        onCheckedChange={() => handleToggle(product.id)}
                                    />
                                    {renderThumbnail(product)}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">{product.productName}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t bg-background px-6 py-4">
                    <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
                        <span className="text-sm text-muted-foreground">
                            {selectedIds.size} selected
                        </span>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <HugeiconsIcon icon={Loading03Icon} className="size-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save changes"
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
