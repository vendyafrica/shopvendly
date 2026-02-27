"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useUpload } from "@/features/media/hooks/use-upload";
import { useHeaderActions } from "@/features/dashboard/context/header-actions-context";
import { Button } from "@shopvendly/ui/components/button";

export default function StudioPage() {
  const params = useParams();
  const storeSlug = params?.slug as string;
  const { setActions } = useHeaderActions();

  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [heroMedia, setHeroMedia] = useState<string[]>([]);
  const [iframeKey, setIframeKey] = useState(0);
  const [isHeroUploading, setIsHeroUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { uploadFile } = useUpload();

  const storefrontUrl =
    process.env.NODE_ENV === "production"
      ? `https://shopvendly.store/${storeSlug}`
      : `http://localhost:3000/${storeSlug}`;

  useEffect(() => {
    // Fetch current store hero media
    const fetchStoreData = async () => {
      try {
        const response = await fetch(`/api/storefront/${storeSlug}`);
        if (response.ok) {
          const store = await response.json();
          setTenantId(store.tenantId ?? null);
          setHeroMedia(Array.isArray(store.heroMedia) ? store.heroMedia : []);
        }
      } catch (error) {
        console.error("Failed to fetch store data:", error);
      }
    };
    fetchStoreData();
  }, [storeSlug]);

  const handleHeroUpdate = (urls: string[]) => {
    setHeroMedia(urls);
    // Reload the iframe to reflect changes
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const compressImage = useCallback(async (file: File): Promise<File> => {
    const imageBitmap = await createImageBitmap(file);
    const maxWidth = 1920;
    const scale =
      imageBitmap.width > maxWidth ? maxWidth / imageBitmap.width : 1;
    const targetWidth = Math.round(imageBitmap.width * scale);
    const targetHeight = Math.round(imageBitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

    const quality = 0.82;
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );

    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }, []);

  const handleHeroFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!tenantId) {
        alert("Store is still loading. Please try again in a moment.");
        return;
      }
      try {
        setIsHeroUploading(true);

        let uploadTarget = file;
        if (file.type.startsWith("image/")) {
          // Reject extremely large pre-compress files
          if (file.size > 12 * 1024 * 1024) {
            alert("Image is too large. Please use a file under 12MB.");
            return;
          }
          uploadTarget = await compressImage(file);
        }

        const uploaded = await uploadFile(uploadTarget, {
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
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "Failed to update hero media");
        }

        handleHeroUpdate(nextUrls);
      } catch (error) {
        console.error("Hero upload failed", error);
        alert(
          error instanceof Error
            ? error.message
            : "Failed to upload hero. Please try again.",
        );
      } finally {
        setIsHeroUploading(false);
      }
    },
    [tenantId, heroMedia, storeSlug, uploadFile, compressImage],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      handleHeroFile(file);
      e.target.value = "";
    },
    [handleHeroFile],
  );

  const openFilePicker = useCallback(() => {
    if (isHeroUploading) return;
    fileInputRef.current?.click();
  }, [isHeroUploading]);

  useEffect(() => {
    const actionNode = (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={openFilePicker}
          disabled={isHeroUploading}
          className="rounded-full px-3 text-xs font-semibold"
        >
          {isHeroUploading ? "Uploading…" : "Update hero media"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={onFileChange}
          className="hidden"
        />
      </div>
    );

    setActions(actionNode);
    return () => setActions(null);
  }, [isHeroUploading, onFileChange, openFilePicker, setActions]);

  return (
    <div className="relative h-screen w-full bg-transparent">
      <div className="absolute inset-0">
        <iframe
          key={iframeKey}
          src={storefrontUrl}
          title="Storefront Preview"
          onLoad={() => setIsLoading(false)}
          className="absolute inset-0 z-0 h-full w-full border-0 bg-white"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-neutral-950">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-white" />
              <span className="text-sm text-neutral-400">
                Loading storefront…
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
