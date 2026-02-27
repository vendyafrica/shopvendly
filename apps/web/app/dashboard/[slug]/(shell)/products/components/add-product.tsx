 "use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Upload04Icon, Cancel01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@shopvendly/ui/components/dialog";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";
import { Label } from "@shopvendly/ui/components/label";
import Image from "next/image";
import { useTenant } from "../../tenant-context";
import { useUpload } from "@/features/media/hooks/use-upload";

interface AddProductProps {
    storeId?: string;
    onProductCreated?: () => void;
}

interface UploadedFile {
    url: string;
    pathname: string;
    contentType: string;
    previewUrl: string; // local preview
    isUploading: boolean;
}

export function AddProduct({ storeId, onProductCreated }: AddProductProps) {
    const { bootstrap } = useTenant();
    const currency = bootstrap?.defaultCurrency || "UGX";
    const tenantId = bootstrap?.tenantId;
    const { uploadFile } = useUpload();

    const [open, setOpen] = React.useState(false);
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Drag and drop state
    const [isDragging, setIsDragging] = React.useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUploadFiles = async (selectedFiles: File[]) => {
        // Create placeholders first for immediate UI feedback
        const newFiles = selectedFiles.map(file => ({
            url: "",
            pathname: "",
            contentType: file.type,
            previewUrl: URL.createObjectURL(file), // immediate local preview
            isUploading: true
        }));

        setFiles(prev => [...prev, ...newFiles]);

        // Process uploads
        // We'll map the index from the end of the previous array
        const startIndex = files.length;

        if (!tenantId) {
            console.error("Missing tenantId for upload");
            setFiles(prev => prev.filter((_, idx) => idx < startIndex));
            return;
        }

        await Promise.all(selectedFiles.map(async (file, i) => {
            const index = startIndex + i;

            try {
                const uploaded = await uploadFile(file, {
                    tenantId,
                    endpoint: "productMedia",
                    compressVideo: true,
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
            } catch (error) {
                console.error("Upload failed", error);
                // Remove failed file
                setFiles(prev => prev.filter((_, idx) => idx !== index));
            }
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            handleUploadFiles(selectedFiles);
        }
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            handleUploadFiles(droppedFiles);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].previewUrl);
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Check if any files are still uploading
        if (files.some(f => f.isUploading)) {
            alert("Please wait for images to finish uploading.");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        const payload = {
            storeId: formData.get("storeId"),
            title: formData.get("title"),
            priceAmount: Number(formData.get("priceAmount")),
            quantity: Number(formData.get("quantity")),
            media: files.map(f => ({
                url: f.url,
                pathname: f.pathname,
                contentType: f.contentType
            }))
        };

        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to create product");

            onProductCreated?.();
            setOpen(false);
            setFiles([]);
        } catch (error) {
            console.error("Failed to create product:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
            setFiles([]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={
                    <Button
                        className="gap-2 rounded-lg border border-border/70 bg-foreground text-background shadow-sm hover:bg-foreground/90"
                    />
                }
            >
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
                Add Product
            </DialogTrigger>

            <DialogContent className="flex w-[96vw] max-w-lg flex-col overflow-hidden p-0 top-auto bottom-0 translate-y-0 rounded-t-2xl max-h-[92vh] sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:max-w-md sm:rounded-lg">
                <DialogHeader className="border-b px-4 py-3 sm:px-6">
                    <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex h-full flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">

                        <input type="hidden" name="storeId" value={storeId} />

                        <div className="space-y-4"> {/* Added wrapper div to hold spacing */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Product Name</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price ({currency})</Label>
                                    <Input
                                        id="price"
                                        name="priceAmount"
                                        type="number"
                                        min="0"
                                        placeholder="Enter price"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        name="quantity"
                                        type="number"
                                        min="0"
                                        placeholder="Enter quantity"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Product Media</Label>
                                <div
                                    className={`flex items-center justify-between gap-3 rounded-lg border border-dashed border-border/70 px-3 py-3 sm:py-4 ${isDragging ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <HugeiconsIcon icon={Upload04Icon} className="size-8 text-muted-foreground" />
                                        <div className="text-left text-sm text-muted-foreground">
                                            <p className="font-medium">{isDragging ? "Drop files" : "Add product media"}</p>
                                            <p className="text-xs text-muted-foreground/70">Images up to 10MB, videos up to 50MB</p>
                                        </div>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        Upload
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,video/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    />
                                </div>

                                {files.length > 0 && (
                                    <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
                                        {files.map((f, i) => (
                                            <div key={i} className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-md border border-border/60">
                                                {f.contentType.startsWith("video/") ? (
                                                    <video
                                                        src={f.previewUrl}
                                                        className={`h-full w-full object-cover transition-opacity ${f.isUploading ? "opacity-50" : "opacity-100"}`}
                                                        muted
                                                        playsInline
                                                    />
                                                ) : (
                                                    <Image
                                                        src={f.previewUrl}
                                                        alt="Preview"
                                                        fill
                                                        className={`object-cover transition-opacity ${f.isUploading ? "opacity-50" : "opacity-100"}`}
                                                    />
                                                )}
                                                {f.isUploading && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin text-white" />
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(i);
                                                    }}
                                                    className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm"
                                                >
                                                    <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 border-t border-border/60 bg-background px-4 py-3 sm:px-6">
                        <DialogFooter className="flex gap-2 w-full">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || files.some(f => f.isUploading)}>
                                {isSubmitting ? (
                                    <>
                                        <HugeiconsIcon icon={Loading03Icon} className="size-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Product"
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}