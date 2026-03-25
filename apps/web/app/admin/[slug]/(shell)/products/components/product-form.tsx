"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ImageUpload01Icon, ArrowLeft02Icon, Add01Icon } from "@hugeicons/core-free-icons";
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
    PRODUCT_SHOE_SIZE_PRESET,
    PRODUCT_UK_SIZE_PRESET,
} from "@shopvendly/db/schema";
import { useTenant } from "@/modules/admin/context/tenant-context";
import type { ProductApiRow } from "@/modules/products/hooks/use-products";
import { useUpload } from "@/modules/media/hooks/use-upload";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { HexPicker } from "./hex-picker";
import { COLOR_MAP, getColorName } from "@/lib/constants/colors";

interface ProductFormProps {
    initialData?: Partial<ProductApiRow>;
    isEditing?: boolean;
    tenantId: string;
    storeId: string;
    onSuccess?: (product: ProductApiRow) => void;
    onCancel?: () => void;
    readOnly?: boolean;
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
    readOnly = false,
}: ProductFormProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { bootstrap } = useTenant();
    const storeCurrency = bootstrap?.defaultCurrency || "UGX";
    const isReadOnly = readOnly || (bootstrap?.storeSlug === "vendly" && !bootstrap?.canWrite);
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
    const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
    const [sizePreset, setSizePreset] = React.useState<"none" | "alpha" | "uk" | "shoe">("none");
    const [selectedSizes, setSelectedSizes] = React.useState<string[]>([]);

    // Image management
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const initialMediaSignatureRef = React.useRef<string>("[]");

    // Initialize collections and variants
    React.useEffect(() => {
        // Reset basic fields when initialData changes (e.g. after a slow load or navigations)
        if (initialData) {
            setProductName(initialData.productName || "");
            setDescription(initialData.description || "");
            setPriceAmount(initialData.priceAmount !== undefined ? String(initialData.priceAmount) : "");
            setOriginalPriceAmount(initialData.originalPriceAmount !== undefined && initialData.originalPriceAmount !== null ? String(initialData.originalPriceAmount) : "");
            setQuantity(initialData.quantity !== undefined ? String(initialData.quantity) : "0");
        }

        if (initialData?.variants?.enabled) {
            const nextVariantOptions: Array<{
                type: string;
                values?: string[];
                preset?: string | null;
            }> = initialData.variants.options ?? [];
            const nextColorOption = nextVariantOptions.find((option) => option.type === "color");
            const nextSizeOption = nextVariantOptions.find((option) => option.type === "size");
            const nextSizePresetValue = (nextSizeOption?.preset as string | undefined) ?? "";
            setSelectedColors(nextColorOption?.values ?? []);
            setSizePreset(nextSizePresetValue === "uk" ? "uk" : nextSizePresetValue === "shoe" ? "shoe" : nextSizeOption ? "alpha" : "none");
            setSelectedSizes(nextSizeOption?.values ?? []);
        } else {
            setSelectedColors([]);
            setSelectedSizes([]);
            setSizePreset("none");
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
        if (isSaving || isReadOnly) return;

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

            const payload: Record<string, unknown> = {
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

            queryClient.removeQueries({
                queryKey: queryKeys.products.all,
                exact: false
            });

            onSuccess?.(result);
            if (!onSuccess) router.push(`/admin/${bootstrap?.storeSlug}/products`);
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                {files.map((f, i) => (
                    <div key={f.id} className="group relative">
                        <div
                            className={cn(
                                "aspect-square overflow-hidden rounded-xl border bg-muted/30 cursor-pointer transition-all",
                                i === 0 ? "border-primary ring-1 ring-primary/25" : "hover:border-primary/50"
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
                                <div className="absolute left-3 top-3 rounded bg-background/95 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm z-10 border border-primary/20">
                                    Main
                                </div>
                            )}

                            {f.isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] z-20">
                                    <UploadProgressSpinner progress={f.displayProgress} />
                                </div>
                            )}
                        </div>

                        {!isSaving && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(i);
                                }}
                                className="absolute -right-2 -top-2 rounded-full bg-destructive p-2 text-white shadow-xl z-30 ring-4 ring-background transform transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-red-600 group-hover:opacity-100"
                                title="Remove image"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                            </button>
                        )}
                    </div>
                ))}

                {/* Add Image Action Item */}
                <div
                    className={cn(
                        "group relative aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/5 transition-all hover:border-primary/30 hover:bg-primary/5 cursor-pointer",
                        isSaving && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="rounded-full bg-muted p-4 group-hover:bg-primary/10 transition-all transform group-hover:scale-110 shadow-sm border border-transparent group-hover:border-primary/20">
                        <HugeiconsIcon icon={ImageUpload01Icon} className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors mt-3">Add image</span>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
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
                    <Button type="submit" size="sm" disabled={isReadOnly || isSaving || files.some(f => f.isUploading)}>
                        {isReadOnly ? "Read only" : isSaving ? "Saving..." : isEditing ? "Save changes" : "Create product"}
                    </Button>
                </div>
            </div>

            {isReadOnly && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Demo viewers can inspect products here, but only a super admin can make changes.
                </div>
            )}

            {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            <div className={isReadOnly ? "space-y-6 pointer-events-none select-none opacity-70" : "space-y-6"}>
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
                                        disabled={isReadOnly || isSaving}
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
                                        disabled={isReadOnly || isSaving}
                                        className="resize-none min-h-[160px]"
                                    />
                                </div>

                                {/* Collections Dropdown */}
                                <div className="space-y-2 pt-2 border-t w-full">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Collections</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={
                                                <Button
                                                    variant="outline"
                                                    className="flex w-full items-center justify-between h-10 font-normal px-3 bg-background hover:bg-accent/50 shadow-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    type="button"
                                                />
                                            }
                                        >
                                            <span className={selectedCollectionIds.length === 0 ? "text-muted-foreground text-sm" : "text-foreground text-sm"}>
                                                {selectedCollectionIds.length === 0
                                                    ? "Select collections"
                                                    : `${selectedCollectionIds.length} collection${selectedCollectionIds.length > 1 ? 's' : ''} selected`
                                                }
                                            </span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 opacity-50 shrink-0"><path d="m6 9 6 6 6-6" /></svg>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="max-h-64 overflow-y-auto" align="start">
                                            {collections.length === 0 ? (
                                                <div className="px-2 py-4 text-center text-xs text-muted-foreground">No collections found.</div>
                                            ) : (
                                                collections.map((col) => (
                                                    <DropdownMenuItem
                                                        key={col.id}
                                                        onSelect={(e) => e.preventDefault()}
                                                        className="flex items-center gap-3 cursor-pointer p-2 rounded-md"
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
                                        disabled={isReadOnly || isSaving}
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
                                        disabled={isReadOnly || isSaving}
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
                                    disabled={isReadOnly || isSaving}
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
                            <div className="flex flex-col gap-5">
                                <div className="grid grid-cols-5 gap-3 sm:grid-cols-8 lg:grid-cols-10">
                                    {/* Render all selected colors first (so custom ones appear) then presets */}
                                    {Array.from(new Set([...selectedColors, ...PRODUCT_COLOR_PRESETS.slice(0, 5)])).map((color) => {
                                        const checked = selectedColors.includes(color);
                                        const swatchColor = COLOR_MAP[color] || 
                                                           (color.includes(":") ? (color.split(":")[1] || "#000000") : 
                                                           (color.startsWith("#") ? color : color.toLowerCase())) || "#000000";
                                        return (
                                            <Button
                                                key={color}
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "relative cursor-pointer size-6 rounded-full border transition-all hover:scale-110 active:scale-95 shadow-sm p-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                                                    checked ? "ring-2 ring-offset-2" : "border-neutral-200 hover:border-neutral-300"
                                                )}
                                                style={{
                                                    backgroundColor: swatchColor,
                                                    borderColor: checked ? swatchColor : (swatchColor.toLowerCase() === "#ffffff" ? "#e5e5e5" : "transparent"),
                                                    boxShadow: checked ? `0 0 0 2px white, 0 0 0 4px ${swatchColor}` : undefined,
                                                }}
                                                aria-pressed={checked}
                                                aria-label={getColorName(color)}
                                                onClick={() => {
                                                    setSelectedColors(prev =>
                                                        checked ? prev.filter(c => c !== color) : [...prev, color]
                                                    );
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-3 py-1">
                                    <HexPicker
                                        onColorSelect={(hex: string) => {
                                            setSelectedColors(prev =>
                                                prev.includes(hex) ? prev : [...prev, hex]
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Size System</Label>
                                <div className="flex flex-wrap gap-2">
                                    {(["none", "alpha", "uk", "shoe"] as const).map((preset) => (
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
                                            {preset === "none" ? "None" : preset === "alpha" ? "Alpha (S/M/L)" : preset === "uk" ? "UK Numeric" : "Shoe (30-46)"}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {sizePreset !== "none" && (
                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Sizes</Label>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {(sizePreset === "alpha"
                                            ? PRODUCT_ALPHA_SIZE_PRESET
                                            : sizePreset === "uk"
                                                ? PRODUCT_UK_SIZE_PRESET
                                                : PRODUCT_SHOE_SIZE_PRESET
                                        ).map((size) => {
                                            const checked = selectedSizes.includes(size);
                                            return (
                                                <Button
                                                    key={size}
                                                    type="button"
                                                    variant={checked ? "secondary" : "outline"}
                                                    size="sm"
                                                    className={cn(
                                                        "min-w-[42px] h-9 rounded-full px-3 text-xs font-medium transition-colors",
                                                        checked && "border-neutral-900 bg-white text-neutral-950 shadow-[inset_0_0_0_1px_rgba(10,10,10,0.08)]"
                                                    )}
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
