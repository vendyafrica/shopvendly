"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Cancel01Icon, ImageUpload01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@shopvendly/ui/components/dialog";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { Label } from "@shopvendly/ui/components/label";
import { Textarea } from "@shopvendly/ui/components/textarea";
import Image from "next/image";
import { useTenant } from "@/app/admin/context/tenant-context";
import type { ProductApiRow } from "@/features/products/hooks/use-products";
import { useUpload } from "@/features/media/hooks/use-upload";

interface Product {
    id: string;
    productName: string;
    description?: string;
    priceAmount: number;
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
}

interface EditProductModalProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenantId: string;
    onProductUpdated?: (product?: ProductApiRow) => void;
}

interface UploadedFile {
    url: string;
    pathname: string;
    contentType: string;
    previewUrl: string;
    isUploading: boolean;
    isNew: boolean;
}

export function EditProductModal({
    product,
    open,
    onOpenChange,
    tenantId,
    onProductUpdated,
}: EditProductModalProps) {
    const { bootstrap } = useTenant();
    const storeCurrency = bootstrap?.defaultCurrency || "UGX";
    const { uploadFile } = useUpload();

    const [productName, setProductName] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [priceAmount, setPriceAmount] = React.useState<string>("");
    const [quantity, setQuantity] = React.useState<string>("");
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Image management
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const initialMediaSignatureRef = React.useRef<string>("[]");

    // Populate form when product changes
    React.useEffect(() => {
        if (product) {
            setProductName(product.productName);
            setDescription(product.description || "");
            setPriceAmount(product.priceAmount ? String(product.priceAmount) : "");
            setQuantity(product.quantity ? String(product.quantity) : "");
            setError(null);

            // Delay the heavy media array generation so the drawer can animate in smoothly on mobile
            const timeout = setTimeout(() => {
                const existingMedia: UploadedFile[] = (product.media || []).map(m => ({
                    url: m.blobUrl,
                    pathname: m.blobPathname || "",
                    contentType: m.contentType || "image/jpeg",
                    previewUrl: m.blobUrl,
                    isUploading: false,
                    isNew: false
                }));

                if (existingMedia.length === 0 && product.thumbnailUrl) {
                    existingMedia.push({
                        url: product.thumbnailUrl,
                        pathname: "",
                        contentType: "image/jpeg",
                        previewUrl: product.thumbnailUrl,
                        isUploading: false,
                        isNew: false
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

    const handleUploadFiles = async (selectedFiles: File[]) => {
        const newFiles = selectedFiles.map(file => ({
            url: "",
            pathname: "",
            contentType: file.type,
            previewUrl: URL.createObjectURL(file),
            isUploading: true,
            isNew: true
        }));

        setFiles(prev => [...prev, ...newFiles]);

        const startIndex = files.length;

        if (!tenantId) {
            setError("Tenant not found. Please refresh and try again.");
            setFiles(prev => prev.filter((_, idx) => idx < startIndex));
            return;
        }

        void Promise.all(selectedFiles.map(async (file, i) => {
            const index = startIndex + i;
            try {
                const uploaded = await uploadFile(file, {
                    tenantId,
                    endpoint: "productMedia",
                    compressVideo: true,
                    skipImageCompression: true,
                });

                setFiles(prev => {
                    const updated = [...prev];
                    if (updated[index]) {
                        updated[index] = {
                            ...updated[index],
                            url: uploaded.url,
                            pathname: uploaded.pathname,
                            isUploading: false
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
                    if (next[index]) next[index].isUploading = false;
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
            const quantityValue = Number(quantity || 0);

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
            <DialogContent className="flex w-[96vw] max-w-4xl flex-col gap-0 overflow-hidden p-0 top-auto bottom-0 translate-y-0 rounded-t-2xl max-h-[92vh] sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:max-h-[85vh] sm:rounded-lg" showCloseButton={false}>
                <div className="border-b px-4 py-3 sm:px-6 sm:py-4">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-5">
                    <div className="space-y-5 sm:space-y-6">
                        {error && (
                            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </p>
                        )}

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
                            {/* Gallery / drop zone */}
                            <div
                                className="space-y-2"
                            >
                                <Label>Product Images</Label>
                                <div className={`flex items-center justify-between gap-3 rounded-lg border border-dashed border-border/70 px-3 py-3 sm:py-4 ${isSaving ? "opacity-70" : "hover:bg-muted/40"}`}>
                                    <div className="flex items-center gap-3">
                                        <HugeiconsIcon icon={ImageUpload01Icon} className="size-8 text-muted-foreground" />
                                        <div className="text-left text-sm text-muted-foreground">
                                            <p className="font-medium">Add product media</p>
                                            <p className="text-xs text-muted-foreground/70">Images or videos up to 10MB</p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        disabled={isSaving}
                                    >
                                        Upload
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

                                {files.length > 0 && (
                                    <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
                                        {files.map((f, i) => (
                                            <div
                                                key={i}
                                                className={`relative aspect-square w-24 shrink-0 overflow-hidden rounded-md border ${i === 0 ? "border-primary" : "border-border/60"}`}
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
                                                {f.contentType.startsWith("video/") ? (
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
                                                        sizes="96px"
                                                        className={`object-cover transition-opacity bg-neutral-100 ${f.isUploading ? "opacity-60" : "opacity-100"}`}
                                                    />
                                                )}
                                                {f.isUploading && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="size-5 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                                                    </div>
                                                )}

                                                {!isSaving && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(i);
                                                        }}
                                                        className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow-sm"
                                                    >
                                                        <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            className="relative flex aspect-square w-24 shrink-0 items-center justify-center rounded-md border border-dashed border-border/70 hover:bg-muted/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current?.click();
                                            }}
                                            disabled={isSaving}
                                        >
                                            <HugeiconsIcon icon={Add01Icon} className="size-4 text-muted-foreground" />
                                            <span className="sr-only">Add more media</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="space-y-4">
                                <div className="space-y-2">
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

                                <div className="grid grid-cols-2 gap-3">
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
                                        <Label htmlFor="quantity">Quantity</Label>
                                        <Input
                                            id="quantity"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="0"
                                            type="number"
                                            min="0"
                                            disabled={isSaving}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
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
                    </div>
                </div>

                <div className="border-t bg-background px-6 py-4">
                    <DialogFooter className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving || files.some(f => f.isUploading)} onClick={handleSubmit}>
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
            </DialogContent>
        </Dialog>
    );
}
