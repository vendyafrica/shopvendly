"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
    PlayIcon, 
    Image02Icon 
} from "@hugeicons/core-free-icons";
import { useUpload } from "@/features/media/hooks/use-upload";
import { CoverUpload } from "./cover-upload";

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
        return VIDEO_EXTENSIONS.some((ext) => parsed.pathname.toLowerCase().endsWith(ext));
    } catch {
        const cleanUrl = url.split("?")[0]?.split("#")[0] ?? url;
        return VIDEO_EXTENSIONS.some((ext) => cleanUrl.toLowerCase().endsWith(ext));
    }
}

export function HeroEditor({ 
    storeSlug, 
    tenantId,
    heroMedia,
    onUpdate 
}: HeroEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const { uploadFile, isUploading } = useUpload();
    console.log("heroMedia", heroMedia);
///hey ...
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

    const handleRemove = async (index: number) => {
        if (!confirm("Are you sure you want to remove this hero media item?")) return;

        try {
            setIsSaving(true);

            const nextUrls = heroMedia.filter((_, i) => i !== index);

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
                throw new Error("Failed to remove hero media");
            }

            onUpdate(nextUrls);
        } catch (error) {
            console.error("Failed to remove hero media:", error);
            alert("Failed to remove hero media. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const hasHeroMedia = heroMedia.length > 0;
    const firstUrl = heroMedia[0];
    const isFirstVideo = typeof firstUrl === "string" && isVideoUrl(firstUrl);

    return (
        <div className="relative group">
            {/* Hero Display */}
            <div className="relative h-[60vh] sm:h-[70vh] md:h-[75vh] lg:h-[80vh] w-full overflow-hidden rounded-b-3xl">
                {hasHeroMedia ? (
                    isFirstVideo ? (
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover"
                        >
                            <source src={firstUrl} type="video/mp4" />
                        </video>
                    ) : (
                        <Image
                            src={firstUrl}
                            alt="Store hero"
                            fill
                            priority
                            className="object-cover"
                        />
                    )
                ) : (
                    <div className="w-full h-full bg-linear-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                        <div className="text-center">
                            <HugeiconsIcon 
                                icon={Image02Icon} 
                                size={48}
                                className="mx-auto mb-4 text-neutral-400" 
                            />
                            <p className="text-neutral-500 text-lg">No hero media</p>
                            <p className="text-neutral-400 text-sm mt-2">
                                Add a hero image or video to showcase your store
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Inline editor content */}
            <div className="absolute inset-0 bg-linear-to-b from-black/5 via-transparent to-black/40 pointer-events-none" />

            <div className="bg-white rounded-xl p-6 shadow-lg mt-4">
                <h3 className="text-lg font-semibold mb-4">Update Hero Media</h3>

                <div className="space-y-4">
                    <CoverUpload
                        accept="image/*,video/*"
                        maxSize={50 * 1024 * 1024}
                        disabled={!tenantId || isUploading || isSaving}
                        title={!tenantId ? "Loading store..." : isUploading ? "Uploading..." : "Upload cover image or video"}
                        description="Drag & drop, or click to browse (images up to 10MB, videos up to 50MB)"
                        onFileSelected={handleCoverSelected}
                    />

                    {heroMedia.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {heroMedia.slice(0, 6).map((url, idx) => (
                                <button
                                    key={`${url}-${idx}`}
                                    type="button"
                                    onClick={() => handleRemove(idx)}
                                    disabled={isSaving}
                                    className="relative aspect-square overflow-hidden rounded-md border border-border/60"
                                >
                                    {isVideoUrl(url) ? (
                                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                                            <HugeiconsIcon icon={PlayIcon} size={18} className="text-neutral-500" />
                                        </div>
                                    ) : (
                                        <Image src={url} alt="Hero item" fill className="object-cover" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
