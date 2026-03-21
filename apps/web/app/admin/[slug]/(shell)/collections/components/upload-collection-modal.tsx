"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageUpload01Icon, Cancel01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
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
import Image from "next/image";
import { useTenant } from "@/app/admin/context/tenant-context";
import { useUpload } from "@/modules/media/hooks/use-upload";

interface UploadCollectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenantId: string;
    onCreate?: (name: string, media?: MediaItem) => void;
}

export interface MediaItem {
    url: string;
    pathname: string;
    contentType: string;
}

interface FilePreview {
    file: File;
    previewUrl: string;
    isUploading: boolean;
    url?: string;
    pathname?: string;
    error?: string;
}

export function UploadCollectionModal({
    open,
    onOpenChange,
    tenantId,
    onCreate,
}: UploadCollectionModalProps) {
    const { uploadFile } = useUpload();

    const [file, setFile] = React.useState<FilePreview | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [collectionName, setCollectionName] = React.useState("");

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const triggerSelect = () => {
        if (!isSaving) {
            fileInputRef.current?.click();
        }
    };

    const handleUploadFile = async (selectedFile: File) => {
        const newFile: FilePreview = {
            file: selectedFile,
            previewUrl: URL.createObjectURL(selectedFile),
            isUploading: true,
            url: undefined,
            pathname: undefined,
            error: undefined
        };

        setFile(newFile);

        if (!tenantId) {
            setError("Tenant not found. Please refresh and try again.");
            setFile(null);
            return;
        }

        try {
            const uploaded = await uploadFile(selectedFile, {
                tenantId,
                endpoint: "storeHeroMedia", // Reusing this endpoint for random featured images/videos or we can use productMedia
                compressVideo: true,
            });

            setFile(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    url: uploaded.url,
                    pathname: uploaded.pathname,
                    isUploading: false
                };
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Upload failed";
            console.error("Upload failed", err);
            setError(`Failed to upload ${selectedFile.name}: ${message}`);
            setFile(prev => {
                if (!prev) return prev;
                return { ...prev, isUploading: false, error: message };
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const file = selectedFiles[0];
        if (selectedFiles.length > 0 && file) {
            handleUploadFile(file);
        }
    };

    const removeFile = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (file) {
            URL.revokeObjectURL(file.previewUrl);
        }
        setFile(null);
    };

    const handleSaveCollection = async () => {
        if (file?.isUploading) {
            setError("Please wait for media to finish uploading.");
            return;
        }

        if (file?.error) {
            setError("File failed to upload. Please remove it and try again.");
            return;
        }

        if (!collectionName.trim()) {
            setError("Collection name is required");
            return;
        }

        try {
            setIsSaving(true);

            let media: MediaItem | undefined = undefined;
            if (file?.url && file?.pathname) {
                media = {
                    url: file.url,
                    pathname: file.pathname,
                    contentType: file.file.type
                };
            }

            onCreate?.(collectionName.trim(), media);

            setFile(null);
            setCollectionName("");
            setError(null);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (isSaving) return;
        if (file) URL.revokeObjectURL(file.previewUrl);
        setFile(null);
        setError(null);
        setCollectionName("");
        onOpenChange(false);
    };

    const handleDialogOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            onOpenChange(true);
            return;
        }
        handleClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="flex max-h-[90svh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-h-[85vh] sm:max-w-3xl sm:top-1/2 sm:-translate-y-1/2 top-[5svh] translate-y-0 rounded-2xl bg-background" showCloseButton={false}>
                <div className="border-b px-6 py-4 bg-linear-to-r from-muted/40 to-background">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Create collection</DialogTitle>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                    <div className="space-y-4">

                        {error && (
                            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                {error}
                            </p>
                        )}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Gallery / drop zone */}
                            <div
                                className="border-2 border-dashed border-border/60 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                                onClick={() => !isSaving && triggerSelect()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!isSaving && e.dataTransfer.files?.length) {
                                        const file = e.dataTransfer.files[0];
                                        if (file) handleUploadFile(file);
                                    }
                                }}
                            >
                                {!file ? (
                                    <div className="text-center py-10">
                                        <HugeiconsIcon
                                            icon={ImageUpload01Icon}
                                            className="size-14 mx-auto text-muted-foreground"
                                        />
                                        <p className="text-sm text-muted-foreground mt-3 font-medium">
                                            Tap to snap or drop a file
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Image / video up to 5MB
                                        </p>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="mt-4 rounded-md"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                triggerSelect();
                                            }}
                                            disabled={isSaving}
                                        >
                                            Choose media
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative aspect-square max-h-80 mx-auto">
                                            {file.file.type.startsWith("video/") ? (
                                                <video
                                                    src={file.previewUrl}
                                                    className={`h-full w-full rounded-md object-cover transition-opacity ${file.isUploading ? "opacity-60" : "opacity-100"}`}
                                                    muted
                                                    playsInline
                                                    controls
                                                    autoPlay
                                                />
                                            ) : (
                                                <div className="relative h-full w-full">
                                                    <Image
                                                        src={file.previewUrl}
                                                        alt="Featured preview"
                                                        fill
                                                        className={`object-contain rounded-md transition-opacity ${file.isUploading ? "opacity-60" : "opacity-100"}`}
                                                    />
                                                </div>
                                            )}
                                            {file.isUploading && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="size-10 rounded-full bg-background/80 flex items-center justify-center">
                                                        <div className="size-7 rounded-full border-2 border-primary/60 border-t-primary animate-spin" />
                                                    </div>
                                                </div>
                                            )}

                                            {!isSaving && !file.isUploading && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(e);
                                                    }}
                                                    className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-sm hover:scale-105 transition-transform hover:bg-destructive/90"
                                                >
                                                    <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isSaving}
                                />
                            </div>

                            {/* Details */}
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="collectionName">Collection Name</Label>
                                    <Input
                                        id="collectionName"
                                        value={collectionName}
                                        onChange={(e) => setCollectionName(e.target.value)}
                                        placeholder="e.g. Summer Collection"
                                        disabled={isSaving}
                                    />
                                    <p className="text-xs text-muted-foreground pt-1">Identify this collection on your storefront.</p>
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
                            onClick={handleClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveCollection}
                            disabled={isSaving || !collectionName.trim() || file?.isUploading}
                        >
                            {isSaving ? (
                                <>
                                    <HugeiconsIcon
                                        icon={Loading03Icon}
                                        className="size-4 mr-2 animate-spin"
                                    />
                                    Saving...
                                </>
                            ) : (
                                "Save Collection"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
