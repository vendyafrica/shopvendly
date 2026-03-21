"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ImageUpload01Icon, Add01Icon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@shopvendly/ui/lib/utils";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { Label } from "@shopvendly/ui/components/label";
import { Textarea } from "@shopvendly/ui/components/textarea";
import { Checkbox } from "@shopvendly/ui/components/checkbox";
import Image from "next/image";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@shopvendly/ui/components/dropdown-menu";
import { useRouter } from "next/navigation";
import {
    PRODUCT_ALPHA_SIZE_PRESET,
    PRODUCT_COLOR_PRESETS,
    PRODUCT_UK_SIZE_PRESET,
} from "@shopvendly/db/schema";
import { useTenant } from "@/modules/admin/context/tenant-context";
import type { ProductApiRow } from "@/modules/products/hooks/use-products";
import type { ProductVariantsInput } from "@/modules/products/lib/product-models";
import { useUpload } from "@/modules/media/hooks/use-upload";

interface ProductFormProps {
    initialData?: Partial<ProductApiRow>;
    isEditing?: boolean;
    tenantId: string;
    storeId: string;
    onSuccess?: (product: ProductApiRow) => void;
    onCancel?: () => void;
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

type StoreCollection = {
    id: string;
    name: string;
};

const COLOR_MAP: Record<string, string> = {
    "Black": "#000000",
    "White": "#FFFFFF",
    "Grey": "#808080",
    "Brown": "#A52A2A",
    "Beige": "#F5F5DC",
    "Navy": "#000080",
    "Blue": "#0000FF",
    "Green": "#008000",
    "Olive": "#808000",
    "Yellow": "#FFFF00",
    "Orange": "#FFA500",
    "Red": "#FF0000",
    "Pink": "#FFC0CB",
    "Purple": "#800080",
    "Gold": "#FFD700",
    "Silver": "#C0C0C0",
};

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

export function ProductForm({
    initialData,
    isEditing = false,
    tenantId,
    storeId,
    onSuccess,
    onCancel,
}: ProductFormProps) {
    const router = useRouter();
    const { bootstrap } = useTenant();
    const storeCurrency = bootstrap?.defaultCurrency || "UGX";
    const { uploadFile } = useUpload();

    const [productName, setProductName] = React.useState(initialData?.productName || "");
    const [description, setDescription] = React.useState(initialData?.description || "");
    const [priceAmount, setPriceAmount] = React.useState<string>(initialData?.priceAmount ? String(initialData?.priceAmount) : "");
    const [originalPriceAmount, setOriginalPriceAmount] = React.useState<string>(initialData?.originalPriceAmount ? String(initialData?.originalPriceAmount) : "");
    const [quantity, setQuantity] = React.useState<string>(initialData?.quantity ? String(initialData?.quantity) : "0");
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [collections, setCollections] = React.useState<StoreCollection[]>([]);
    const [selectedCollectionIds, setSelectedCollectionIds] = React.useState<string[]>(initialData?.collectionIds || []);
    const [variantsEnabled, setVariantsEnabled] = React.useState(true);
    const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
    const [sizePreset, setSizePreset] = React.useState<"none" | "alpha" | "uk">("none");
    const [selectedSizes, setSelectedSizes] = React.useState<string[]>([]);
    const [customColor, setCustomColor] = React.useState("");
    const [customSize, setCustomSize] = React.useState("");

    // Image management
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const initialMediaSignatureRef = React.useRef<string>("[]");

    // Initialize collections and variants
    React.useEffect(() => {
        if (initialData?.variants?.enabled) {
            const nextVariantOptions = initialData.variants.options ?? [];
            const nextColorOption = nextVariantOptions.find((option) => option.type === "color");
            const nextSizeOption = nextVariantOptions.find((option) => option.type === "size");
            setSelectedColors(nextColorOption?.values ?? []);
            setSizePreset(nextSizeOption?.preset === "uk" ? "uk" : nextSizeOption ? "alpha" : "none");
            setSelectedSizes(nextSizeOption?.values ?? []);
        }

        if (initialData?.media) {
            const existingMedia: UploadedFile[] = initialData.media.map(m => ({
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
            setFiles(existingMedia);
            initialMediaSignatureRef.current = JSON.stringify(
                existingMedia.map((m) => ({
                    url: m.url,
                    pathname: m.pathname,
                    contentType: m.contentType,
                }))
            );
        }
    }, [initialData]);

    // Fetch collections
    React.useEffect(() => {
        if (!storeId) return;
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
        return () => { active = false; };
    }, [storeId]);

    // Media progress simulation
    React.useEffect(() => {
        const hasActiveUpload = files.some((file) => file.isUploading || file.displayProgress < file.progress);
        if (!hasActiveUpload) return;

        const frame = window.setInterval(() => {
            setFiles((prev) => prev.map((file) => {
                if (!file.isUploading && file.displayProgress >= file.progress) return file;
                const nextTarget = file.isUploading
                    ? Math.max(file.progress, Math.min(file.displayProgress + 8, 95))
                    : file.progress;
                const step = file.isUploading ? 4 : 12;
                const nextDisplayProgress = Math.min(file.displayProgress + step, nextTarget);
                if (nextDisplayProgress === file.displayProgress) return file;
                return { ...file, displayProgress: nextDisplayProgress };
            }));
        }, 80);

        return () => window.clearInterval(frame);
    }, [files]);

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

        await Promise.all(selectedFiles.map(async (file, i) => {
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
                                const targetFile = updated[targetIndex]!;
                                updated[targetIndex] = { ...targetFile, progress };
                            }
                            return updated;
                        });
                    },
                });

                setFiles(prev => {
                    const updated = [...prev];
                    const targetIndex = updated.findIndex((item) => item.id === fileId);
                    if (targetIndex >= 0) {
                        const targetFile = updated[targetIndex]!;
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
                console.error("Upload failed", err);
                setError(`Failed to upload ${file.name}`);
                setFiles(prev => prev.filter(f => f.id !== fileId));
            }
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) handleUploadFiles(selectedFiles);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (index: number) => {
        setFiles((prev) => {
            const updated = [...prev];
            const target = updated[index];
            if (target?.isNew && target.previewUrl) URL.revokeObjectURL(target.previewUrl);
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

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

            if (originalPriceAmount && originalPriceValue !== null && originalPriceValue <= priceValue) {
                throw new Error("Original price must be greater than the current price");
            }

            const payload: Record<string, any> = {
                productName,
                description,
                priceAmount: priceValue,
                originalPriceAmount: originalPriceValue,
                quantity: quantityValue,
                storeId,
                status: initialData?.status || "ready",
            };

            const currentMediaSignature = JSON.stringify(
                files.map((f) => ({ url: f.url, pathname: f.pathname, contentType: f.contentType }))
            );

            if (currentMediaSignature !== initialMediaSignatureRef.current) {
                payload.media = files.map((f) => ({ url: f.url, pathname: f.pathname, contentType: f.contentType }));
            }

            payload.collectionIds = selectedCollectionIds;
            const hasVariants = selectedColors.length > 0 || selectedSizes.length > 0;
            payload.variants = hasVariants
                ? {
                    enabled: true,
                    options: [
                        ...(selectedColors.length > 0 ? [{ type: "color", label: "Color", values: selectedColors }] : []),
                        ...(selectedSizes.length > 0
                            ? [{ type: "size", label: "Size", values: selectedSizes, preset: sizePreset === "none" ? null : sizePreset }]
                            : []),
                    ],
                }
                : null;

            const url = isEditing ? `/api/products/${initialData?.id}` : "/api/products";
            const method = isEditing ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${isEditing ? "update" : "create"} product`);
            }

            const result = (await response.json()) as ProductApiRow;
            onSuccess?.(result);
            if (!onSuccess) router.back();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const mediaManager = (
        <div className="space-y-4">
            <div className="space-y-1">
                <Label className="text-sm font-semibold">Media</Label>
                <p className="text-xs text-muted-foreground">Upload and manage product images/videos.</p>
            </div>
            
            <div className={cn(
                "group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/5 py-8 px-4 transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                files.length > 0 && "mb-4",
                isSaving && "opacity-50 pointer-events-none"
            )} onClick={() => fileInputRef.current?.click()}>
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="rounded-full bg-muted p-3">
                        <HugeiconsIcon icon={ImageUpload01Icon} className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Click or drag to upload</p>
                        <p className="text-xs text-muted-foreground">Images or videos up to 10MB</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2 h-8">
                        Select files
                    </Button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {files.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {files.map((f, i) => (
                        <div
                            key={f.id}
                            className={cn(
                                "group relative aspect-square overflow-hidden rounded-lg border bg-muted/30",
                                i === 0 && "border-primary ring-1 ring-primary/25"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (i !== 0) {
                                    setFiles((prev) => {
                                        const updated = [...prev];
                                        const [moved] = updated.splice(i, 1);
                                        if (moved) updated.unshift(moved);
                                        return updated;
                                    });
                                }
                            }}
                        >
                            {f.contentType.startsWith("video/") ? (
                                <video src={f.previewUrl} className="h-full w-full object-cover" muted playsInline />
                            ) : (
                                <Image
                                    src={f.previewUrl}
                                    alt="Preview"
                                    fill
                                    unoptimized={f.previewUrl.startsWith("blob:")}
                                    className="object-cover"
                                />
                            )}
                            
                            {i === 0 && (
                                <div className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                    Main
                                </div>
                            )}

                            {f.isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
                                    <UploadProgressSpinner progress={f.displayProgress} />
                                </div>
                            )}

                            {!isSaving && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(i);
                                    }}
                                    className="absolute right-1.5 top-1.5 rounded-full bg-destructive p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-5xl md:space-y-6 space-y-4 pb-12">
            <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur-md py-4 border-b -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-3">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9" 
                        onClick={() => onCancel ? onCancel() : router.back()}
                    >
                        <HugeiconsIcon icon={ArrowLeft02Icon} size={20} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            {isEditing ? "Edit product" : "Add product"}
                        </h1>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                            {isEditing ? "Update existing product details" : "Create a new item in your store"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => onCancel ? onCancel() : router.back()} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isSaving || files.some(f => f.isUploading)}>
                        {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create product"}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {/* Top Section: Basic Info & Pricing/Inventory */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info & Collections */}
                        <div className="rounded-xl border bg-card p-5 space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="productName">Product Name</Label>
                                    <Input
                                        id="productName"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        placeholder="e.g. Necklace test"
                                        required
                                        disabled={isSaving}
                                        className="h-10 text-base"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Tell us more about this product..."
                                        rows={8}
                                        disabled={isSaving}
                                        className="resize-none min-h-[160px]"
                                    />
                                </div>
                                
                                {/* Collections Dropdown */}
                                <div className="space-y-2 pt-2 border-t">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Collections</Label>
                                    <DropdownMenu>
                                        {(() => {
                                            const Trigger = DropdownMenuTrigger as any;
                                            return (
                                                <Trigger asChild>
                                                    <Button 
                                                        variant="outline" 
                                                        className="w-full justify-between h-10 font-normal px-3"
                                                        type="button"
                                                    >
                                                        {selectedCollectionIds.length === 0 
                                                            ? "Select collections" 
                                                            : `${selectedCollectionIds.length} collection${selectedCollectionIds.length > 1 ? 's' : ''} selected`
                                                        }
                                                        <HugeiconsIcon icon={Add01Icon} className="size-4 opacity-50" />
                                                    </Button>
                                                </Trigger>
                                            )
                                        })()}
                                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-64 overflow-y-auto" align="start">
                                            {collections.length === 0 ? (
                                                <div className="px-2 py-4 text-center text-xs text-muted-foreground">No collections found.</div>
                                            ) : (
                                                collections.map((col) => (
                                                    <DropdownMenuItem 
                                                        key={col.id} 
                                                        onSelect={(e) => e.preventDefault()}
                                                        className="flex items-center gap-3 cursor-pointer p-2"
                                                        onClick={() => {
                                                            setSelectedCollectionIds(prev => 
                                                                prev.includes(col.id) ? prev.filter(id => id !== col.id) : [...prev, col.id]
                                                            );
                                                        }}
                                                    >
                                                        <Checkbox 
                                                            checked={selectedCollectionIds.includes(col.id)}
                                                            className="pointer-events-none"
                                                        />
                                                        <span className="text-sm">{col.name}</span>
                                                    </DropdownMenuItem>
                                                ))
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Pricing */}
                        <div className="rounded-xl border bg-card p-5 space-y-4">
                            <h2 className="text-sm font-semibold text-muted-foreground tracking-tight uppercase">Pricing</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="priceAmount" className="text-xs">Price ({storeCurrency})</Label>
                                    <Input
                                        id="priceAmount"
                                        value={priceAmount}
                                        onChange={(e) => setPriceAmount(e.target.value)}
                                        placeholder="0"
                                        type="number"
                                        min="0"
                                        required
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="originalPriceAmount" className="text-xs text-muted-foreground">Original Price</Label>
                                    <Input
                                        id="originalPriceAmount"
                                        value={originalPriceAmount}
                                        onChange={(e) => setOriginalPriceAmount(e.target.value)}
                                        placeholder="Optional"
                                        type="number"
                                        min="0"
                                        disabled={isSaving}
                                        className="bg-muted/5 h-9"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Inventory */}
                        <div className="rounded-xl border bg-card p-5 space-y-4">
                            <h2 className="text-sm font-semibold text-muted-foreground tracking-tight uppercase">Inventory</h2>
                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="text-xs">Quantity available</Label>
                                <Input
                                    id="quantity"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="0"
                                    type="number"
                                    min="0"
                                    disabled={isSaving}
                                />
                                <p className="text-[10px] text-muted-foreground">Adjust your stock levels here.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Media Manager cuts across */}
                <div className="rounded-xl border bg-card p-5">
                    {mediaManager}
                </div>

                {/* Variants below Media */}
                <div className="rounded-xl border bg-card p-5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-sm font-semibold text-muted-foreground tracking-tight uppercase">Variants</h2>
                            <p className="text-xs text-muted-foreground">Manage colors and sizes for this product.</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6 pt-2 border-t">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Colors</Label>
                            <div className="flex flex-wrap gap-2 items-center">
                                {[...PRODUCT_COLOR_PRESETS, ...selectedColors.filter(c => (PRODUCT_COLOR_PRESETS as readonly string[]).indexOf(c) === -1)].map((color) => {
                                    const checked = selectedColors.includes(color);
                                    return (
                                        <Button
                                            key={color}
                                            type="button"
                                            variant={checked ? "default" : "outline"}
                                            size="sm"
                                            className={cn(
                                                "h-8 rounded-full text-xs gap-2 px-3 transition-all",
                                                checked && "ring-2 ring-primary/20 ring-offset-1 border-primary/50"
                                            )}
                                            onClick={() => {
                                                setSelectedColors(prev => 
                                                    checked ? prev.filter(c => c !== color) : [...prev, color]
                                                );
                                            }}
                                        >
                                            <div 
                                                className="size-3 rounded-full border border-black/10 shadow-sm" 
                                                style={{ backgroundColor: COLOR_MAP[color] || color.toLowerCase() }} 
                                            />
                                            {color}
                                        </Button>
                                    );
                                })}
                                
                                <div className="flex items-center gap-1.5 ml-1">
                                    <div className="relative">
                                        <Input
                                            placeholder="Add color..."
                                            value={customColor}
                                            onChange={(e) => setCustomColor(e.target.value)}
                                            className="h-8 w-44 text-xs pr-8 rounded-full"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (customColor && !selectedColors.includes(customColor)) {
                                                        setSelectedColors(prev => [...prev, customColor]);
                                                        setCustomColor("");
                                                    }
                                                }
                                            }}
                                        />
                                        <div 
                                            className="absolute right-2 top-1/2 -translate-y-1/2 size-4 rounded-full border border-black/10 shadow-inner"
                                            style={{ backgroundColor: customColor || 'transparent' }}
                                        />
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => {
                                            if (customColor && !selectedColors.includes(customColor)) {
                                                setSelectedColors(prev => [...prev, customColor]);
                                                setCustomColor("");
                                            }
                                        }}
                                    >
                                        <HugeiconsIcon icon={Add01Icon} className="size-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Size System</Label>
                                <div className="flex flex-wrap gap-2">
                                    {(["none", "alpha", "uk"] as const).map((preset) => (
                                        <Button
                                            key={preset}
                                            type="button"
                                            variant={sizePreset === preset ? "secondary" : "ghost"}
                                            size="sm"
                                            className="h-8"
                                            onClick={() => {
                                                setSizePreset(preset);
                                                setSelectedSizes([]);
                                            }}
                                        >
                                            {preset === "none" ? "None" : preset === "alpha" ? "Alpha (S/M/L)" : "UK Numeric"}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {sizePreset !== "none" && (
                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Sizes</Label>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {(sizePreset === "alpha" ? PRODUCT_ALPHA_SIZE_PRESET : PRODUCT_UK_SIZE_PRESET).map((size) => {
                                            const checked = selectedSizes.includes(size);
                                            return (
                                                <Button
                                                    key={size}
                                                    type="button"
                                                    variant={checked ? "default" : "outline"}
                                                    size="sm"
                                                    className="min-w-[40px] h-8"
                                                    onClick={() => {
                                                        setSelectedSizes(prev =>
                                                            checked ? prev.filter(s => s !== size) : [...prev, size]
                                                        );
                                                    }}
                                                >
                                                    {size}
                                                </Button>
                                            );
                                        })}
                                        
                                        {/* Show custom sizes that aren't in the preset */}
                                        {selectedSizes.filter(s => 
                                            ((sizePreset === "alpha" ? PRODUCT_ALPHA_SIZE_PRESET : PRODUCT_UK_SIZE_PRESET) as readonly string[]).indexOf(s) === -1
                                        ).map((size) => (
                                            <Button
                                                key={size}
                                                type="button"
                                                variant="default"
                                                size="sm"
                                                className="min-w-[40px] h-8 border-primary/50"
                                                onClick={() => setSelectedSizes(prev => prev.filter(s => s !== size))}
                                            >
                                                {size}
                                            </Button>
                                        ))}

                                        <div className="flex items-center gap-1.5 ml-1">
                                            <Input
                                                placeholder="Add custom..."
                                                value={customSize}
                                                onChange={(e) => setCustomSize(e.target.value)}
                                                className="h-8 w-32 text-xs rounded-md"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (customSize && !selectedSizes.includes(customSize)) {
                                                            setSelectedSizes(prev => [...prev, customSize]);
                                                            setCustomSize("");
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8"
                                                onClick={() => {
                                                    if (customSize && !selectedSizes.includes(customSize)) {
                                                        setSelectedSizes(prev => [...prev, customSize]);
                                                        setCustomSize("");
                                                    }
                                                }}
                                            >
                                                <HugeiconsIcon icon={Add01Icon} className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Pro Tip at the very bottom */}
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                        <HugeiconsIcon icon={Add01Icon} size={16} />
                        <h3 className="text-sm font-bold tracking-tight uppercase">Pro Tip</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        High-quality images and a detailed description can increase your sales by up to <strong>40%</strong>. Make sure to highlight what makes this product unique!
                    </p>
                </div>
            </div>
        </form>
    );
}
