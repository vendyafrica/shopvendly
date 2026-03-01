"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shopvendly/ui/components/button";
import { cn } from "@shopvendly/ui/lib/utils";
import { useUpload } from "@/features/media/hooks/use-upload";

interface HeroEditorProps {
    storeSlug: string;
    tenantId: string | null;
    heroMedia: string[];
    onUpdate: (urls: string[]) => void;
}

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg"];

function isVideoUrl(url: string) {
    try {
        const parsed = new URL(url);
        const typeParam = parsed.searchParams.get("x-ut-file-type") || parsed.searchParams.get("file-type");
        if (typeParam && typeParam.toLowerCase().startsWith("video")) return true;

        const pathname = parsed.pathname.toLowerCase();
        const hasVideoExt = VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
        if (hasVideoExt) return true;

        // Treat extensionless UploadThing URLs as video by default
        const hasNoExtension = !pathname.includes(".");
        return hasNoExtension;
    } catch {
        const cleanUrl = url.split("?")[0]?.split("#")[0] ?? url;
        const lower = cleanUrl.toLowerCase();
        const hasVideoExt = VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
        if (hasVideoExt) return true;

        const hasNoExtension = !lower.includes(".");
        return hasNoExtension;
    }
}

export function HeroEditor({ 
    storeSlug, 
    tenantId,
    heroMedia,
    onUpdate 
}: HeroEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { uploadFile, isUploading } = useUpload();

    const handleCoverSelected = async (file: File | null) => {
        if (!file) return;

        try {
            setIsSaving(true);

            if (!tenantId) {
                alert("Store is still loading. Please try again in a moment.");
                return;
            }

            const uploaded = await uploadFile(file, {
                tenantId,
                endpoint: "storeHeroMedia",
                compressVideo: true,
            });
            const rest = heroMedia.filter((_, idx) => idx !== 0);
            const nextUrls = [uploaded.url, ...rest];

            const response = await fetch(`/api/storefront/${storeSlug}/hero`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    heroMedia: nextUrls,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update hero media");
            }

            onUpdate(nextUrls);
        } catch (error) {
            console.error("Failed to upload hero media:", error);
            alert("Failed to upload hero media. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const hasHeroMedia = heroMedia.length > 0;

    const triggerFileDialog = () => {
        if (!tenantId || isSaving || isUploading) return;
        inputRef.current?.click();
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        void handleCoverSelected(file);
        event.target.value = "";
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (!tenantId || isSaving || isUploading) return;
        const file = event.dataTransfer.files?.[0] ?? null;
        void handleCoverSelected(file);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!tenantId || isSaving || isUploading) return;
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <div className="rounded-2xl border bg-card/80 p-4 sm:p-6 space-y-6">
            <div className="space-y-1">
                <h3 className="text-lg font-semibold">Storefront header</h3>
                <p className="text-sm text-muted-foreground">
                    Update your hero here
                </p>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleInputChange}
                disabled={!tenantId || isSaving || isUploading}
            />

            <div
                onClick={triggerFileDialog}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "relative overflow-hidden rounded-xl border border-dashed px-6 py-12 text-center transition",
                    !tenantId || isSaving || isUploading ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                    isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/30"
                )}
            >
                {hasHeroMedia ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                        {isVideoUrl(heroMedia[0] ?? "") ? (
                            <video
                                src={heroMedia[0]}
                                className="h-full w-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={heroMedia[0]} alt="Current hero" className="h-full w-full object-cover" />
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white drop-shadow-sm pointer-events-none">
                            <HugeiconsIcon icon={Image02Icon} size={32} />
                            <p className="text-base font-medium">Drag & drop to replace</p>
                            <p className="text-xs text-white/80">Or click to browse</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="rounded-full bg-primary/10 p-4">
                            <HugeiconsIcon icon={Image02Icon} size={32} className="text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-base font-medium">
                                {isUploading ? "Uploading media..." : "Drag & drop media or click to browse"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Images up to 10MB, videos up to 50MB. Supported formats: JPG, PNG, MP4, WEBM.
                            </p>
                        </div>
                    </div>
                )}

                {!hasHeroMedia ? (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!tenantId || isSaving || isUploading}
                    >
                        {isUploading ? "Uploading..." : "Choose file"}
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
