import { UTApi, UTFile } from "uploadthing/server";

const utapi = new UTApi();

export interface UploadFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
}

export interface UploadResult {
    url: string;
    pathname: string;
    originalName: string;
    contentType: string;
}

type UploadThingSuccess = {
    key: string;
    ufsUrl: string;
};

type UploadThingResultLike = {
    data: UploadThingSuccess | null;
    error: unknown | null;
};

function assertUploadSuccess(result: UploadThingResultLike | UploadThingResultLike[]) {
    const normalized = Array.isArray(result) ? result[0] : result;
    if (!normalized || normalized.error || !normalized.data) {
        const reason = normalized && normalized.error
            ? JSON.stringify(normalized.error)
            : "Unknown UploadThing upload error";
        throw new Error(`UploadThing upload failed: ${reason}`);
    }

    return normalized.data;
}

/**
 * Media Service for serverless environment
 * Handles UploadThing uploads and media management
 */
export const mediaService = {
    /**
     * Upload multiple product media files
     */
    async uploadProductMedia(
        files: UploadFile[],
        tenantSlug: string,
        productId: string
    ): Promise<{ count: number; images: UploadResult[] }> {
        if (files.length === 0) {
            return { count: 0, images: [] };
        }

        const uploadPromises = files.map(async (file) => {
            const timestamp = Date.now();
            const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
            const customId = `${tenantSlug}/products/${productId}/${timestamp}-${sanitizedFilename}`;
            const uploadFile = new UTFile([Uint8Array.from(file.buffer)], sanitizedFilename, {
                type: file.mimetype,
                lastModified: Date.now(),
                customId,
            });

            const uploadedRes = await utapi.uploadFiles(uploadFile, {
                acl: "public-read",
                contentDisposition: "inline",
            });
            const uploaded = assertUploadSuccess(uploadedRes);

            // Using ufsUrl instead of deprecated url or appUrl
            return {
                url: uploaded.ufsUrl,
                pathname: uploaded.key,
                originalName: file.originalname,
                contentType: file.mimetype,
            };
        });

        const images = await Promise.all(uploadPromises);

        return {
            count: images.length,
            images,
        };
    },

    /**
     * Upload a single file
     */
    async uploadSingle(
        file: UploadFile,
        tenantSlug: string,
        folder: string = "images"
    ): Promise<{ url: string; pathname: string }> {
        const timestamp = Date.now();
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        const customId = `${tenantSlug}/${folder}/${timestamp}-${sanitizedFilename}`;

        const uploadFile = new UTFile([Uint8Array.from(file.buffer)], sanitizedFilename, {
            type: file.mimetype,
            lastModified: Date.now(),
            customId,
        });

        const uploadedRes = await utapi.uploadFiles(uploadFile, {
            acl: "public-read",
            contentDisposition: "inline",
        });
        const uploaded = assertUploadSuccess(uploadedRes);

        return {
            url: uploaded.ufsUrl,
            pathname: uploaded.key,
        };
    },

    /**
     * Delete multiple UploadThing files by key
     */
    async deleteFiles(fileKeys: string[]): Promise<void> {
        const keys = fileKeys.filter(Boolean);
        if (keys.length === 0) return;

        await utapi.deleteFiles(keys);
    },

    /**
     * List files for a tenant by customId prefix
     */
    async listTenantBlobs(
        tenantSlug: string,
        options?: { limit?: number; cursor?: string }
    ) {
        const limit = options?.limit || 100;
        const offset = Number.parseInt(options?.cursor || "0", 10) || 0;
        const result = await utapi.listFiles({
            limit,
            offset,
        });

        const scopedFiles = result.files.filter((file) =>
            (file.customId ?? "").startsWith(`${tenantSlug}/`)
        );

        const blobs = await Promise.all(
            scopedFiles.map(async (file) => {
                const signed = await utapi.getSignedURL(file.key);
                return {
                    url: signed.ufsUrl,
                    pathname: file.key,
                    size: file.size,
                    uploadedAt: new Date(file.uploadedAt),
                };
            })
        );

        return {
            blobs,
            hasMore: result.hasMore,
            cursor: result.hasMore ? String(offset + limit) : undefined,
        };
    },
};