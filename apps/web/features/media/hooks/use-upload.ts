import { useCallback, useState } from "react";
import { useUploadThing } from "@/utils/uploadthing";

type UploadEndpoint = "productMedia" | "storeHeroMedia";

type UploadOptions = {
    tenantId: string;
    endpoint?: UploadEndpoint;
    compressVideo?: boolean;
    skipImageCompression?: boolean;
};

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

async function blobToFile(blob: Blob, originalName: string, type: string): Promise<File> {
    const fallbackName = originalName.replace(/\.[^/.]+$/, "") || "upload";
    const extension = type.includes("/") ? type.split("/")[1] : "mp4";
    const finalName = `${fallbackName}-compressed.${extension}`;

    return new File([blob], finalName, {
        type,
        lastModified: Date.now(),
    });
}

async function compressVideoClientSide(file: File): Promise<File> {
    if (typeof document === "undefined") {
        throw new Error("Video compression is only available in the browser.");
    }

    if (typeof MediaRecorder === "undefined") {
        throw new Error("This browser does not support video compression. Please compress the video before uploading.");
    }

    const objectUrl = URL.createObjectURL(file);

    try {
        const video = document.createElement("video");
        video.src = objectUrl;
        video.muted = true;
        video.playsInline = true;

        await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => reject(new Error("Failed to read video metadata."));
        });

        const maxWidth = 1280;
        const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
        const targetWidth = Math.max(2, Math.floor(video.videoWidth * scale));
        const targetHeight = Math.max(2, Math.floor(video.videoHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Failed to initialize compression canvas.");
        }

        const stream = canvas.captureStream(24);
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
            ? "video/webm;codecs=vp9"
            : "video/webm";

        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 2_000_000,
        });

        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        const recordingDone = new Promise<Blob>((resolve, reject) => {
            recorder.onerror = () => reject(new Error("Video compression failed."));
            recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
        });

        recorder.start(250);
        await video.play();

        await new Promise<void>((resolve) => {
            const drawFrame = () => {
                context.drawImage(video, 0, 0, targetWidth, targetHeight);
                if (!video.paused && !video.ended) {
                    requestAnimationFrame(drawFrame);
                }
            };

            video.onended = () => resolve();
            requestAnimationFrame(drawFrame);
        });

        recorder.stop();
        const compressedBlob = await recordingDone;

        return blobToFile(compressedBlob, file.name, "video/webm");
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}


// ─── Image compression ─────────────────────────────────────────────────────
const IMAGE_COMPRESS_MAX_PX = 1600; // max dimension (width or height)
const IMAGE_COMPRESS_QUALITY = 0.82; // JPEG/WebP quality
const IMAGE_COMPRESS_THRESHOLD_BYTES = 300 * 1024; // only compress if > 300 KB

async function compressImageClientSide(file: File): Promise<File> {
    if (typeof document === "undefined") return file;

    return new Promise((resolve) => {
        const img = new window.Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const { naturalWidth: w, naturalHeight: h } = img;
            const scale = Math.min(1, IMAGE_COMPRESS_MAX_PX / Math.max(w, h));
            const targetW = Math.max(2, Math.round(w * scale));
            const targetH = Math.max(2, Math.round(h * scale));

            const canvas = document.createElement("canvas");
            canvas.width = targetW;
            canvas.height = targetH;

            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(file); return; }

            ctx.drawImage(img, 0, 0, targetW, targetH);

            const outputType = "image/jpeg";
            canvas.toBlob(
                (blob) => {
                    if (!blob) { resolve(file); return; }
                    // Only use compressed version if it's actually smaller
                    if (blob.size >= file.size) { resolve(file); return; }
                    const baseName = file.name.replace(/\.[^/.]+$/, "");
                    resolve(new File([blob], `${baseName}.jpg`, {
                        type: outputType,
                        lastModified: Date.now(),
                    }));
                },
                outputType,
                IMAGE_COMPRESS_QUALITY
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(file); // fail-safe: upload original if we can't read the image
        };

        img.src = objectUrl;
    });
}

async function prepareFileForUpload(file: File, options: UploadOptions): Promise<File> {
    if (file.type.startsWith("image/")) {
        if (file.size > IMAGE_MAX_BYTES) {
            throw new Error("Image file is too large. Maximum image size is 10MB.");
        }
        // Compress any image that's meaningfully large to avoid slow uploads / slow first-load
        if (!options.skipImageCompression && file.size > IMAGE_COMPRESS_THRESHOLD_BYTES) {
            return compressImageClientSide(file);
        }
        return file;
    }

    if (file.type.startsWith("video/") && file.size > VIDEO_MAX_BYTES) {
        if (!options.compressVideo) {
            throw new Error("Video file is too large. Maximum video size is 50MB.");
        }

        const compressed = await compressVideoClientSide(file);
        if (compressed.size > VIDEO_MAX_BYTES) {
            throw new Error("Video is still larger than 50MB after compression. Please compress more and try again.");
        }

        return compressed;
    }

    return file;
}


export function useUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const productUpload = useUploadThing("productMedia");
    const heroUpload = useUploadThing("storeHeroMedia");

    const uploadFile = useCallback(
        async (file: File, options: UploadOptions): Promise<{ url: string; pathname: string }> => {
            setIsUploading(true);
            try {
                const endpoint = options.endpoint ?? "productMedia";
                const preparedFile = await prepareFileForUpload(file, options);

                const startUpload = endpoint === "storeHeroMedia"
                    ? heroUpload.startUpload
                    : productUpload.startUpload;

                const uploads = (await startUpload([preparedFile], {
                    tenantId: options.tenantId,
                })) ?? [];

                const uploaded = uploads[0];
                if (!uploaded) {
                    throw new Error("Upload failed. No file returned by UploadThing.");
                }

                const appendTypeParam = (url: string, type: string | undefined) => {
                    if (!type) return url;
                    const separator = url.includes("?") ? "&" : "?";
                    return `${url}${separator}x-ut-file-type=${encodeURIComponent(type)}`;
                };

                const urlWithType = appendTypeParam(uploaded.ufsUrl, preparedFile.type);

                return {
                    url: urlWithType,
                    pathname: uploaded.key,
                };
            } finally {
                setIsUploading(false);
            }
        },
        [heroUpload.startUpload, productUpload.startUpload]
    );

    return { uploadFile, isUploading };
}
