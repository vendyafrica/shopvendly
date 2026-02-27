import { useCallback, useState } from "react";
import { uploadFiles } from "@/utils/uploadthing";

type UploadEndpoint = "productMedia" | "storeHeroMedia";

type UploadOptions = {
    tenantId: string;
    endpoint?: UploadEndpoint;
    compressVideo?: boolean;
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

async function prepareFileForUpload(file: File, options: UploadOptions): Promise<File> {
    if (file.type.startsWith("image/") && file.size > IMAGE_MAX_BYTES) {
        throw new Error("Image file is too large. Maximum image size is 10MB.");
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

    const uploadFile = useCallback(
        async (file: File, options: UploadOptions): Promise<{ url: string; pathname: string }> => {
            setIsUploading(true);
            try {
                const endpoint = options.endpoint ?? "productMedia";
                const preparedFile = await prepareFileForUpload(file, options);

                const uploads = await uploadFiles(endpoint, {
                    files: [preparedFile],
                    input: {
                        tenantId: options.tenantId,
                    },
                });

                const uploaded = uploads[0];
                if (!uploaded) {
                    throw new Error("Upload failed. No file returned by UploadThing.");
                }

                return {
                    url: uploaded.ufsUrl,
                    pathname: uploaded.key,
                };
            } finally {
                setIsUploading(false);
            }
        },
        []
    );

    return { uploadFile, isUploading };
}
