import { db, mediaObjects, productMedia, products, and, eq } from "@shopvendly/db";
import { productRepo } from "@/modules/products/repo/product-repo";
import { mediaService, type UploadFile } from "../../media/services/media-service";
import type { CreateProductInput, ProductFilters, ProductWithMedia, UpdateProductInput } from "./product-models";

type ProductRow = typeof products.$inferSelect;

function slugifyName(name: string) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(tx: { query: typeof db.query }, storeId: string, base: string) {
    let slug = base;
    let suffix = 1;

    while (
        await tx.query.products.findFirst({
            where: and(eq(products.storeId, storeId), eq(products.slug, slug)),
        })
    ) {
        slug = `${base}-${suffix++}`;
    }

    return slug;
}

type PgConstraintError = {
    code?: string;
    constraint?: string;
};

function isSlugConflict(error: unknown): error is PgConstraintError {
    return Boolean(
        error
        && typeof error === "object"
        && "code" in error
        && "constraint" in error
        && (error as PgConstraintError).code === "23505"
        && (error as PgConstraintError).constraint === "products_store_slug_unique"
    );
}

async function generateUniqueSlugWithTimestamp(tx: { query: typeof db.query }, storeId: string, base: string) {
    const timestamp = Date.now();
    let slug = `${base}-${timestamp}`;
    let suffix = 1;

    while (
        await tx.query.products.findFirst({
            where: and(eq(products.storeId, storeId), eq(products.slug, slug)),
        })
    ) {
        slug = `${base}-${timestamp}-${suffix++}`;
    }

    return slug;
}

/**
 * Product Service for serverless environment
 */
export const productService = {
    async syncProductCollections(
        productId: string,
        tenantId: string,
        storeId: string,
        collectionIds: string[]
    ): Promise<string[]> {
        return productRepo.syncCollections(productId, tenantId, storeId, collectionIds);
    },

    /**
     * Create a new product with optional media
     */
    async createProduct(
        tenantId: string,
        tenantSlug: string,
        data: CreateProductInput,
        files: UploadFile[] = []
    ): Promise<ProductWithMedia> {
        const baseSlug = slugifyName(data.productName);

        let slug = await generateUniqueSlug({ query: db.query }, data.storeId, baseSlug);
        let product: ProductRow | undefined = undefined;

        try {
            product = await productRepo.create({
                tenantId,
                storeId: data.storeId,
                productName: data.productName,
                slug,
                description: data.description,
                priceAmount: data.priceAmount,
                originalPriceAmount: data.originalPriceAmount ?? null,
                currency: data.currency,
                quantity: data.quantity,
                source: data.source,
                sourceId: data.sourceId,
                sourceUrl: data.sourceUrl,
                status: data.status,
                variants: data.variants ?? null,
            });
        } catch (error: unknown) {
            if (isSlugConflict(error)) {
                slug = await generateUniqueSlugWithTimestamp({ query: db.query }, data.storeId, baseSlug);
                product = await productRepo.create({
                    tenantId,
                    storeId: data.storeId,
                    productName: data.productName,
                    slug,
                    description: data.description,
                    priceAmount: data.priceAmount,
                    originalPriceAmount: data.originalPriceAmount ?? null,
                    currency: data.currency,
                    quantity: data.quantity,
                    source: data.source,
                    sourceId: data.sourceId,
                    sourceUrl: data.sourceUrl,
                    status: data.status,
                    variants: data.variants ?? null,
                });
            } else {
                throw error;
            }
        }

        if (!product) {
            throw new Error("Failed to create product");
        }

        const assignedCollectionIds = await this.syncProductCollections(
            product.id,
            tenantId,
            data.storeId,
            data.collectionIds ?? []
        );

        let formattedMedia: Array<{ sortOrder: number; isFeatured: boolean } & typeof mediaObjects.$inferSelect> = [];

        if (files.length > 0) {
            const uploadResult = await mediaService.uploadProductMedia(files, tenantSlug, product.id);
            const mediaObjectsData = await db.insert(mediaObjects).values(
                uploadResult.images.map((img) => ({
                    tenantId,
                    blobUrl: img.url,
                    blobPathname: img.pathname,
                    contentType: img.contentType || "application/octet-stream",
                    source: "upload",
                }))
            ).returning();

            await db.insert(productMedia).values(
                mediaObjectsData.map((m, index) => ({
                    tenantId,
                    productId: product.id,
                    mediaId: m.id,
                    sortOrder: index,
                    isFeatured: index === 0,
                }))
            );

            formattedMedia = mediaObjectsData.map((m, index) => ({
                ...m,
                sortOrder: index,
                isFeatured: index === 0,
            }));
        }

        return { ...product, media: formattedMedia, collectionIds: assignedCollectionIds } as ProductWithMedia;
    },

    /**
     * Upload files and attach to product
     */
    async uploadAndAttachMedia(
        tenantId: string,
        tenantSlug: string,
        productId: string,
        files: UploadFile[]
    ) {
        if (files.length === 0) return [];

        const uploadResult = await mediaService.uploadProductMedia(files, tenantSlug, productId);

        const mediaObjectsData = await db.insert(mediaObjects).values(
            uploadResult.images.map((img) => ({
                tenantId,
                blobUrl: img.url,
                blobPathname: img.pathname,
                contentType: img.contentType || "application/octet-stream",
                source: "upload",
            }))
        ).returning();

        await db.insert(productMedia).values(
            mediaObjectsData.map((media, index) => ({
                tenantId,
                productId,
                mediaId: media.id,
                sortOrder: index,
                isFeatured: index === 0,
            }))
        );

        return mediaObjectsData;
    },

    /**
     * Attach existing media URLs (e.g. from client-side upload)
     */
    async attachMediaUrls(
        tenantId: string,
        productId: string,
        media: Array<{ url: string; pathname: string; contentType?: string }>
    ) {
        if (media.length === 0) return [];

        const mediaObjectsData = await db.insert(mediaObjects).values(
            media.map((m) => ({
                tenantId,
                blobUrl: m.url,
                blobPathname: m.pathname,
                contentType: m.contentType || "image/jpeg",
                source: "upload",
            }))
        ).returning();

        await db.insert(productMedia).values(
            mediaObjectsData.map((mediaObj, index) => ({
                tenantId,
                productId,
                mediaId: mediaObj.id,
                sortOrder: index,
                isFeatured: index === 0,
            }))
        );

        return mediaObjectsData;
    },

    /**
     * Get product with media
     */
    async getProductWithMedia(id: string, tenantId: string): Promise<ProductWithMedia> {
        const product = await productRepo.findWithMedia(id, tenantId);

        if (!product) {
            throw new Error("Product not found");
        }

        const formattedMedia = product.media.map((pm) => ({
            ...pm.media,
            sortOrder: pm.sortOrder,
            isFeatured: pm.isFeatured,
        }));

        const collectionIds = await productRepo.getCollectionIds(id);

        return { ...product, media: formattedMedia, collectionIds } as ProductWithMedia;
    },

    /**
     * List products for a tenant
     */
    async listProducts(tenantId: string, filters: ProductFilters): Promise<{
        products: ProductWithMedia[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { page, limit } = filters;
        const { products: productList, total: count } = await productRepo.list(tenantId, filters);

        const salesMap = await productRepo.getSalesMap(tenantId, productList.map(p => p.id));

        type ProductListItem = (typeof productList)[number];
        type ProductMediaItem = ProductListItem["media"][number];

        const productsWithMedia = productList.map((p: ProductListItem) => ({
            ...p,
            media: p.media.map((pm: ProductMediaItem) => ({
                ...pm.media,
                sortOrder: pm.sortOrder,
                isFeatured: pm.isFeatured,
            })),
            salesAmount: salesMap.get(p.id) ?? 0,
        }));

        return {
            products: productsWithMedia as ProductWithMedia[],
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        };
    },

    /**
     * Update a product
     */
    async updateProduct(id: string, tenantId: string, data: UpdateProductInput): Promise<ProductWithMedia> {
        const { media, collectionIds, ...productData } = data;

        const updated = await productRepo.update(id, tenantId, productData);

        if (!updated) {
            throw new Error("Product not found");
        }

        if (media) {
            // Sync media
            await db.delete(productMedia).where(and(
                eq(productMedia.productId, id),
                eq(productMedia.tenantId, tenantId)
            ));

            await Promise.all(media.map(async (m, index) => {
                let mediaId: string;

                const existing = await db.query.mediaObjects.findFirst({
                    where: and(
                        eq(mediaObjects.tenantId, tenantId),
                        eq(mediaObjects.blobUrl, m.url)
                    )
                });

                if (existing) {
                    mediaId = existing.id;
                } else {
                    const [newMedia] = await db.insert(mediaObjects).values({
                        tenantId,
                        blobUrl: m.url,
                        blobPathname: m.pathname,
                        contentType: m.contentType || "image/jpeg",
                        source: "upload",
                    }).returning();
                    if (!newMedia) {
                        throw new Error("Failed to create media object");
                    }
                    mediaId = newMedia.id;
                }

                await db.insert(productMedia).values({
                    tenantId,
                    productId: id,
                    mediaId,
                    sortOrder: index,
                    isFeatured: index === 0
                });
            }));
        }

        if (collectionIds) {
            await this.syncProductCollections(id, tenantId, updated.storeId, collectionIds);
        }

        return this.getProductWithMedia(id, tenantId);
    },

    /**
     * Delete a product and its media
     */
    async deleteProduct(id: string, tenantId: string): Promise<ProductWithMedia> {
        const product = await this.getProductWithMedia(id, tenantId);

        await productRepo.delete(id, tenantId);

        // Delete uploaded media from UploadThing by file key
        const uploadedMedia = product.media.filter((m) => m.source === "upload");
        if (uploadedMedia.length > 0) {
            await mediaService.deleteFiles(
                uploadedMedia
                    .map((m) => m.blobPathname)
                    .filter((value): value is string => Boolean(value))
            );
        }

        return product;
    },

    /**
     * Helper: Generate a clean title from filename
     */
    generateTitleFromFilename(filename: string): string {
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        const cleaned = nameWithoutExt.replace(/[_-]/g, " ");
        return cleaned
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    },
};
