"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Cancel01Icon, ImageUpload01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import {
    Dialog,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogPortal,
    DialogOverlay,
    DialogPrimitive,
} from "@shopvendly/ui/components/dialog";
import { cn } from "@shopvendly/ui/lib/utils";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { Label } from "@shopvendly/ui/components/label";
import { Textarea } from "@shopvendly/ui/components/textarea";
import { Checkbox } from "@shopvendly/ui/components/checkbox";
import Image from "next/image";
import {
    PRODUCT_ALPHA_SIZE_PRESET,
    PRODUCT_COLOR_PRESETS,
    PRODUCT_UK_SIZE_PRESET,
} from "@shopvendly/db/schema";
import { useTenant } from "@/app/admin/context/tenant-context";
import type { ProductApiRow } from "@/features/products/hooks/use-products";
import type { ProductVariantsInput } from "@/features/products/lib/product-models";
import { useUpload } from "@/features/media/hooks/use-upload";

interface Product {
    id: string;
    productName: string;
    description?: string;
    priceAmount: number;
    originalPriceAmount?: number | null;
    currency: string;
    quantity: number;
    status: string;
    thumbnailUrl?: string;
    salesAmount?: number;
    media?: {
        id?: string;
        blobUrl: string;
        contentType?: string;
        blobPathname?: string;
    }[];
    collectionIds?: string[];
    variants?: ProductVariantsInput | null;
}

type StoreCollection = {
    id: string;
    name: string;
};

interface EditProductModalProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenantId: string;
    storeId: string;
    onProductUpdated?: (product?: ProductApiRow) => void;
}

interface UploadedFile {
    id: string;
    url: string;
    pathname: string;
    contentType: string;
    previewUrl: string;
    isUploading: boolean;
    isNew: boolean;
    progress: number;
    displayProgress: number;
    startedAt: number;
}

function UploadProgressSpinner({ progress }: { progress: number }) {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.max(0, Math.min(progress, 100)) / 100) * circumference;

    return (
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
                <circle cx="24" cy="24" r={radius} className="fill-none stroke-white/20" strokeWidth="4" />
                <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    className="fill-none stroke-white transition-all duration-150"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <span className="absolute text-[11px] font-semibold text-white">{progress}%</span>
        </div>
    );
}

export function EditProductModal({
    product,
    open,
    onOpenChange,
    tenantId,
    storeId,
    onProductUpdated,
}: EditProductModalProps) {
    const { bootstrap } = useTenant();
    const storeCurrency = bootstrap?.defaultCurrency || "UGX";
    const { uploadFile } = useUpload();

    const [productName, setProductName] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [priceAmount, setPriceAmount] = React.useState<string>("");
    const [originalPriceAmount, setOriginalPriceAmount] = React.useState<string>("");
    const [quantity, setQuantity] = React.useState<string>("");
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [collections, setCollections] = React.useState<StoreCollection[]>([]);
    const [selectedCollectionIds, setSelectedCollectionIds] = React.useState<string[]>([]);
    const [variantsEnabled, setVariantsEnabled] = React.useState(false);
    const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
    const [sizePreset, setSizePreset] = React.useState<"none" | "alpha" | "uk">("none");
    const [selectedSizes, setSelectedSizes] = React.useState<string[]>([]);

    // Image management
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const initialMediaSignatureRef = React.useRef<string>("[]");

    React.useEffect(() => {
        const hasActiveUpload = files.some((file) => file.isUploading || file.displayProgress < file.progress);
        if (!hasActiveUpload) return;

        const frame = window.setInterval(() => {
            setFiles((prev) => prev.map((file) => {
                if (!file.isUploading && file.displayProgress >= file.progress) {
                    return file;
                }

                const nextTarget = file.isUploading
                    ? Math.max(file.progress, Math.min(file.displayProgress + 8, 95))
                    : file.progress;
                const step = file.isUploading ? 4 : 12;
                const nextDisplayProgress = Math.min(file.displayProgress + step, nextTarget);

                if (nextDisplayProgress === file.displayProgress) {
                    return file;
                }

                return {
                    ...file,
                    displayProgress: nextDisplayProgress,
                };
            }));
        }, 80);

        return () => window.clearInterval(frame);
    }, [files]);

    // Populate form when product changes
    React.useEffect(() => {
        if (product) {
            setProductName(product.productName);
            setDescription(product.description || "");
            setPriceAmount(product.priceAmount ? String(product.priceAmount) : "");
            setOriginalPriceAmount(product.originalPriceAmount ? String(product.originalPriceAmount) : "");
            setQuantity(product.quantity ? String(product.quantity) : "");
            setSelectedCollectionIds(product.collectionIds ?? []);

            const nextVariantOptions = product.variants?.enabled ? product.variants.options ?? [] : [];
            const nextColorOption = nextVariantOptions.find((option) => option.type === "color");
            const nextSizeOption = nextVariantOptions.find((option) => option.type === "size");
            setVariantsEnabled(Boolean(product.variants?.enabled));
            setSelectedColors(nextColorOption?.values ?? []);
            setSizePreset(nextSizeOption?.preset === "uk" ? "uk" : nextSizeOption ? "alpha" : "none");
            setSelectedSizes(nextSizeOption?.values ?? []);
            setError(null);

            // Delay the heavy media array generation so the drawer can animate in smoothly on mobile
            const timeout = setTimeout(() => {
                const existingMedia: UploadedFile[] = (product.media || []).map(m => ({
                    id: m.blobPathname || m.blobUrl,
                    url: m.blobUrl,
                    pathname: m.blobPathname || "",
                    contentType: m.contentType || "image/jpeg",
                    previewUrl: m.blobUrl,
                    isUploading: false,
                    isNew: false,
                    progress: 100,
                    displayProgress: 100,
                    startedAt: Date.now(),
                }));

                if (existingMedia.length === 0 && product.thumbnailUrl) {
                    existingMedia.push({
                        id: product.thumbnailUrl,
                        url: product.thumbnailUrl,
                        pathname: "",
                        contentType: "image/jpeg",
                        previewUrl: product.thumbnailUrl,
                        isUploading: false,
                        isNew: false,
                        progress: 100,
                        displayProgress: 100,
                        startedAt: Date.now(),
                    });
                }

                setFiles(existingMedia);
                initialMediaSignatureRef.current = JSON.stringify(
                    existingMedia.map((m) => ({
                        url: m.url,
                        pathname: m.pathname,
                        contentType: m.contentType,
                    }))
                );
            }, 100); // 100ms is usually enough for a bottom sheet animation to finish 

            return () => clearTimeout(timeout);
        }
    }, [product]);

    React.useEffect(() => {
        if (!open || !storeId) return;

        let active = true;
        const loadCollections = async () => {
            try {
                const params = new URLSearchParams({ storeId });
                const res = await fetch(`/api/store-collections?${params.toString()}`, { cache: "no-store" });
                if (!res.ok) return;
                const data = (await res.json()) as StoreCollection[];
                if (active) setCollections(data);
            } catch {
                if (active) setCollections([]);
            }
        };

        void loadCollections();
        return () => {
            active = false;
        };
    }, [open, storeId]);

    const handleUploadFiles = async (selectedFiles: File[]) => {
        const startedAt = Date.now();
        const newFiles = selectedFiles.map((file, index) => ({
            id: `${file.name}-${file.lastModified}-${Date.now()}-${index}`,
            url: "",
            pathname: "",
            contentType: file.type,
            previewUrl: URL.createObjectURL(file),
            isUploading: true,
            isNew: true,
            progress: 0,
            displayProgress: 0,
            startedAt,
        }));

        setFiles(prev => [...prev, ...newFiles]);

        if (!tenantId) {
            setError("Tenant not found. Please refresh and try again.");
            setFiles(prev => prev.filter((existing) => !newFiles.some((file) => file.id === existing.id)));
            return;
        }

        void Promise.all(selectedFiles.map(async (file, i) => {
            const fileId = newFiles[i]?.id;
            if (!fileId) return;
            try {
                const uploaded = await uploadFile(file, {
                    tenantId,
                    endpoint: "productMedia",
                    compressVideo: true,
                    skipImageCompression: true,
                    onUploadProgress: ({ progress }) => {
                        setFiles((prev) => {
                            const updated = [...prev];
                            const targetIndex = updated.findIndex((item) => item.id === fileId);
                            if (targetIndex >= 0) {
                                const targetFile = updated[targetIndex];
                                if (!targetFile) {
                                    return updated;
                                }

                                updated[targetIndex] = {
                                    ...targetFile,
                                    progress,
                                };
                            }
                            return updated;
                        });
                    },
                });

                setFiles(prev => {
                    const updated = [...prev];
                    const targetIndex = updated.findIndex((item) => item.id === fileId);
                    if (targetIndex >= 0) {
                        const targetFile = updated[targetIndex];
                        if (!targetFile) {
                            return updated;
                        }

                        updated[targetIndex] = {
                            ...targetFile,
                            url: uploaded.url,
                            pathname: uploaded.pathname,
                            isUploading: false,
                            progress: 100,
                        };
                    }
                    return updated;
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : "Upload failed";
                console.error("Upload failed", err);
                setError(`Failed to upload ${file.name}: ${message}`);
                setFiles(prev => {
                    const next = [...prev];
                    const targetIndex = next.findIndex((item) => item.id === fileId);
                    if (targetIndex >= 0) {
                        const targetFile = next[targetIndex];
                        if (!targetFile) {
                            return next;
                        }

                        next[targetIndex] = {
                            ...targetFile,
                            isUploading: false,
                            progress: 0,
                            displayProgress: 0,
                        };
                    }
                    return next;
                });
            }
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            handleUploadFiles(selectedFiles);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (index: number) => {
        setFiles((prev) => {
            const updated = [...prev];
            const target = updated[index];
            if (!target) return prev;
            // Only revoke created object URLs, not remote ones
            if (target.isNew && target.previewUrl) {
                URL.revokeObjectURL(target.previewUrl);
            }
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product || isSaving) return;

        if (files.some(f => f.isUploading)) {
            alert("Please wait for images to finish uploading.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const priceValue = Math.round(Number(priceAmount || 0));
            const originalPriceValue = originalPriceAmount ? Math.round(Number(originalPriceAmount)) : null;
            const quantityValue = Number(quantity || 0);

            if (originalPriceAmount && (Number.isNaN(originalPriceValue) || (originalPriceValue ?? 0) <= priceValue)) {
                throw new Error("Original price must be greater than the current price");
            }

            // Separate newly added media logic if needed in backend, 
            // but for now we might only send basic info.
            // NOTE: The current PATCH endpoint (as per previous files) only updates fields.
            // We need to support updating media.
            // For now, we'll just update basic fields as before, plus send new media if the endpoint supports it.
            // We should ideally update PATCH endpoint to handle media updates (add/remove).
            // Assuming we refactored PATCH API? Not yet. 
            // Strategy: Send new media in a separate array or 'media' field if supported.
            // The existing PATCH logic only handled: productName, priceAmount, quantity, status.

            // We'll update the PATCH payload to include media URLs
            // Backend PATCH needs to be updated to sync media.

            const payload: Record<string, unknown> = {
                productName,
                description,
                priceAmount: priceValue,
                originalPriceAmount: originalPriceValue,
                quantity: quantityValue,
                // preserve current status unless explicitly changed elsewhere
                status: product.status,
            };

            const currentMediaSignature = JSON.stringify(
                files.map((f) => ({
                    url: f.url,
                    pathname: f.pathname,
                    contentType: f.contentType,
                }))
            );

            // Only send media if it actually changed; otherwise we avoid expensive media sync in the backend.
            if (currentMediaSignature !== initialMediaSignatureRef.current) {
                payload.media = files.map((f) => ({
                    url: f.url,
                    pathname: f.pathname,
                    contentType: f.contentType,
                }));
            }

            payload.collectionIds = selectedCollectionIds;
            payload.variants = variantsEnabled
                ? {
                    enabled: true,
                    options: [
                        ...(selectedColors.length > 0 ? [{ type: "color" as const, label: "Color", values: selectedColors }] : []),
                        ...(selectedSizes.length > 0
                            ? [{ type: "size" as const, label: "Size", values: selectedSizes, preset: sizePreset === "none" ? null : sizePreset }]
                            : []),
                    ],
                }
                : null;

            const response = await fetch(`/api/products/${product.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update product");
            }

            const updatedProduct = (await response.json()) as ProductApiRow;

            onOpenChange(false);
            onProductUpdated?.(updatedProduct);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Update failed");
        } finally {
            setIsSaving(false);
        }
    };

    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay />
                <DialogPrimitive.Popup
                    className={cn(
                        "fixed left-1/2 top-1/2 z-50 flex w-[96vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden rounded-2xl bg-background p-0 shadow-lg outline-none",
                        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95",
                        "h-[92svh] sm:h-[88vh]"
                    )}
                >
                <div className="border-b px-5 py-4 sm:px-7 sm:py-5">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold sm:text-lg">Edit Product</DialogTitle>
                    </DialogHeader>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                    <div className="flex h-full overflow-hidden">
                        <div className="hidden w-[360px] shrink-0 overflow-y-auto border-r border-border/60 bg-muted/10 lg:block">
                            <div className="space-y-4 px-7 py-6">
                                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
                                    <div className="mb-4 space-y-1">
                                        <Label className="text-sm font-medium text-foreground">Product Images</Label>
                                        <p className="text-xs text-muted-foreground">Upload, reorder, and remove media for this product.</p>
                                    </div>
                                    <div className={`flex flex-col items-start gap-3 rounded-xl border border-dashed border-border/70 bg-background px-4 py-4 ${isSaving ? "opacity-70" : "hover:bg-muted/40"}`}>
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-xl bg-muted p-2.5">
                                                <HugeiconsIcon icon={ImageUpload01Icon} className="size-5 text-muted-foreground" />
                                            </div>
                                            <div className="text-left text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground">Add product media</p>
                                                <p className="text-xs text-muted-foreground/70">Images or videos up to 10MB</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-9 rounded-lg px-4"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current?.click();
                                            }}
                                            disabled={isSaving}
                                        >
                                            Upload media
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,video/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileChange}
                                            disabled={isSaving}
                                        />
                                    </div>

                                    {files.length > 0 ? (
                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            {files.map((f, i) => (
                                                <div
                                                    key={f.id}
                                                    className={`group relative aspect-square overflow-hidden rounded-xl border bg-background ${i === 0 ? "border-primary ring-1 ring-primary/25" : "border-border/60"}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (i !== 0) {
                                                            setFiles((prev) => {
                                                                const updated = [...prev];
                                                                const [moved] = updated.splice(i, 1);
                                                                if (!moved) return prev;
                                                                updated.unshift(moved);
                                                                return updated;
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {i === 0 ? (
                                                        f.contentType.startsWith("video/") ? (
                                                            <video
                                                                src={f.previewUrl}
                                                                className={`h-full w-full object-cover bg-neutral-100 transition-opacity ${f.isUploading ? "opacity-55" : "opacity-100"}`}
                                                                muted
                                                                playsInline
                                                                preload="none"
                                                            />
                                                        ) : (
                                                            <Image
                                                                src={f.previewUrl}
                                                                alt="Preview"
                                                                fill
                                                                unoptimized={f.previewUrl.includes(".ufs.sh") || f.previewUrl.startsWith("blob:")}
                                                                loading="lazy"
                                                                sizes="(min-width: 1024px) 220px, 50vw"
                                                                className={`object-cover bg-neutral-100 transition-opacity ${f.isUploading ? "opacity-55" : "opacity-100"}`}
                                                            />
                                                        )
                                                    ) : f.contentType.startsWith("video/") ? (
                                                        <video
                                                            src={f.previewUrl}
                                                            className={`h-full w-full object-cover transition-opacity bg-neutral-100 ${f.isUploading ? "opacity-60" : "opacity-100"}`}
                                                            muted
                                                            playsInline
                                                            preload="none"
                                                        />
                                                    ) : (
                                                        <Image
                                                            src={f.previewUrl}
                                                            alt="Preview"
                                                            fill
                                                            unoptimized={f.previewUrl.includes(".ufs.sh") || f.previewUrl.startsWith("blob:")}
                                                            loading="lazy"
                                                            sizes="(min-width: 1024px) 220px, 50vw"
                                                            className={`object-cover transition-opacity bg-neutral-100 ${f.isUploading ? "opacity-60" : "opacity-100"}`}
                                                        />
                                                    )}
                                                    {i === 0 ? (
                                                        <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground shadow-sm">
                                                            Cover
                                                        </span>
                                                    ) : null}
                                                    {i === 0 && f.isUploading ? (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <UploadProgressSpinner progress={f.displayProgress} />
                                                        </div>
                                                    ) : null}

                                                    {!isSaving && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeFile(i);
                                                            }}
                                                            className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm"
                                                        >
                                                            <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                className="relative flex aspect-square items-center justify-center rounded-xl border border-dashed border-border/70 bg-background hover:bg-muted/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    fileInputRef.current?.click();
                                                }}
                                                disabled={isSaving}
                                            >
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <HugeiconsIcon icon={Add01Icon} className="size-4" />
                                                    <span className="text-xs font-medium">Add more</span>
                                                </div>
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                            {error && (
                                <p className="mb-5 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </p>
                            )}

                            <div className="space-y-5">
                                <div className="rounded-2xl border border-border/60 bg-background p-4 sm:p-5">
                                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                        <div className="space-y-2 lg:col-span-2">
                                            <Label htmlFor="productName">Product Name</Label>
                                            <Input
                                                id="productName"
                                                value={productName}
                                                onChange={(e) => setProductName(e.target.value)}
                                                placeholder="e.g. Black Hoodie"
                                                required
                                                disabled={isSaving}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="priceAmount">Price ({storeCurrency})</Label>
                                                <Input
                                                    id="priceAmount"
                                                    value={priceAmount}
                                                    onChange={(e) => setPriceAmount(e.target.value)}
                                                    placeholder="0"
                                                    type="number"
                                                    min="0"
                                                    disabled={isSaving}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="originalPriceAmount">Original Price ({storeCurrency})</Label>
                                                <Input
                                                    id="originalPriceAmount"
                                                    value={originalPriceAmount}
                                                    onChange={(e) => setOriginalPriceAmount(e.target.value)}
                                                    placeholder="Optional"
                                                    type="number"
                                                    min="0"
                                                    disabled={isSaving}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 lg:col-span-1">
                                            <Label htmlFor="quantity">Quantity</Label>
                                            <Input
                                                id="quantity"
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                placeholder="Available quantity"
                                                disabled={isSaving}
                                            />
                                        </div>

                                        <div className="space-y-2 lg:col-span-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Describe the product..."
                                                rows={5}
                                                disabled={isSaving}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-border/60 bg-background p-4 sm:p-5">
                                    <div className="mb-3 space-y-1">
                                        <Label>Collections</Label>
                                        <p className="text-xs text-muted-foreground">Choose where this product should appear in the storefront.</p>
                                    </div>
                                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-muted/10 p-3.5">
                                        {collections.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No collections yet.</p>
                                        ) : (
                                            collections.map((collection) => {
                                                const checked = selectedCollectionIds.includes(collection.id);
                                                return (
                                                    <label key={collection.id} className="flex items-center gap-3 text-sm">
                                                        <Checkbox
                                                            checked={checked}
                                                            onCheckedChange={(nextChecked) => {
                                                                setSelectedCollectionIds((prev) =>
                                                                    nextChecked
                                                                        ? [...prev, collection.id]
                                                                        : prev.filter((id) => id !== collection.id)
                                                                );
                                                            }}
                                                            disabled={isSaving}
                                                        />
                                                        <span>{collection.name}</span>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 rounded-2xl border border-border/60 bg-background p-4 sm:p-5">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">Variants</p>
                                        <p className="text-xs text-muted-foreground">Control optional size and color choices on the storefront.</p>
                                    </div>
                                    <label className="flex items-center gap-3 text-sm font-medium">
                                        <Checkbox
                                            checked={variantsEnabled}
                                            onCheckedChange={(checked) => setVariantsEnabled(Boolean(checked))}
                                            disabled={isSaving}
                                        />
                                        <span>Add sizes / colors</span>
                                    </label>

                                    {variantsEnabled ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Preset colors</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {PRODUCT_COLOR_PRESETS.map((color) => {
                                                        const checked = selectedColors.includes(color);
                                                        return (
                                                            <Button
                                                                key={color}
                                                                type="button"
                                                                variant={checked ? "default" : "outline"}
                                                                size="sm"
                                                                className="h-8 rounded-full px-3"
                                                                onClick={() => {
                                                                    setSelectedColors((prev) =>
                                                                        checked ? prev.filter((value) => value !== color) : [...prev, color]
                                                                    );
                                                                }}
                                                            >
                                                                {color}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Size preset</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {(["none", "alpha", "uk"] as const).map((preset) => {
                                                        const isActive = sizePreset === preset;
                                                        const label = preset === "none"
                                                            ? "No sizes"
                                                            : preset === "alpha"
                                                                ? "XS / S / M / L / XL"
                                                                : "UK sizes";
                                                        return (
                                                            <Button
                                                                key={preset}
                                                                type="button"
                                                                variant={isActive ? "default" : "outline"}
                                                                size="sm"
                                                                className="h-8 rounded-full px-3"
                                                                onClick={() => {
                                                                    setSizePreset(preset);
                                                                    setSelectedSizes([]);
                                                                }}
                                                            >
                                                                {label}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {sizePreset !== "none" ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {(sizePreset === "uk" ? PRODUCT_UK_SIZE_PRESET : PRODUCT_ALPHA_SIZE_PRESET).map((size) => {
                                                        const checked = selectedSizes.includes(size);
                                                        return (
                                                            <Button
                                                                key={size}
                                                                type="button"
                                                                variant={checked ? "default" : "outline"}
                                                                size="sm"
                                                                className="h-8 rounded-full px-3"
                                                                onClick={() => {
                                                                    setSelectedSizes((prev) =>
                                                                        checked ? prev.filter((value) => value !== size) : [...prev, size]
                                                                    );
                                                                }}
                                                            >
                                                                {size}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t bg-background px-5 py-4 sm:px-7">
                    <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button className="w-full sm:w-auto" type="submit" disabled={isSaving || files.some(f => f.isUploading)} onClick={handleSubmit}>
                            {isSaving ? (
                                <>
                                    <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save changes"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
                </DialogPrimitive.Popup>
            </DialogPortal>
        </Dialog>
    );
}
