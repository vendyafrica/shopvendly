import { db } from "@shopvendly/db/db";
import { products, productMedia, mediaObjects, orderItems, orders } from "@shopvendly/db/schema";
import { eq, and, isNull, desc, sql, like } from "@shopvendly/db";
import { mediaService, type UploadFile } from "../../media/lib/media-service";
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
    /**
     * Create a new product with optional media
     */
    async createProduct(
        tenantId: string,
        tenantSlug: string,
        data: CreateProductInput,
        files: UploadFile[] = []
    ): Promise<ProductWithMedia> {
        const baseSlug = slugifyName(data.title);

        let slug = await generateUniqueSlug({ query: db.query }, data.storeId, baseSlug);
        let product: ProductRow | null = null;

        try {
            const insertedProducts = await db.insert(products).values({
                tenantId,
                storeId: data.storeId,
                productName: data.title,
                slug,
                description: data.description,
                priceAmount: data.priceAmount,
                currency: data.currency,
                quantity: data.quantity,
                source: data.source,
                sourceId: data.sourceId,
                sourceUrl: data.sourceUrl,
                status: data.status,
            }).returning();
            product = insertedProducts[0] ?? null;
        } catch (error: unknown) {
            if (isSlugConflict(error)) {
                slug = await generateUniqueSlugWithTimestamp({ query: db.query }, data.storeId, baseSlug);
                const insertedProducts = await db.insert(products).values({
                    tenantId,
                    storeId: data.storeId,
                    productName: data.title,
                    slug,
                    description: data.description,
                    priceAmount: data.priceAmount,
                    currency: data.currency,
                    quantity: data.quantity,
                    source: data.source,
                    sourceId: data.sourceId,
                    sourceUrl: data.sourceUrl,
                    status: data.status,
                }).returning();
                product = insertedProducts[0] ?? null;
            } else {
                throw error;
            }
        }

        if (!product) {
            throw new Error("Failed to create product");
        }

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

        return { ...product, media: formattedMedia } as ProductWithMedia;
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
        const product = await db.query.products.findFirst({
            where: and(
                eq(products.id, id),
                eq(products.tenantId, tenantId),
                isNull(products.deletedAt)
            ),
            with: {
                media: {
                    with: { media: true },
                    orderBy: (m, { asc }) => [asc(m.sortOrder)],
                },
            },
        });

        if (!product) {
            throw new Error("Product not found");
        }

        const formattedMedia = product.media.map((pm) => ({
            ...pm.media,
            sortOrder: pm.sortOrder,
            isFeatured: pm.isFeatured,
        }));

        return { ...product, media: formattedMedia } as ProductWithMedia;
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
        const { storeId, source, page, limit, search } = filters;
        const offset = (page - 1) * limit;

        // Removed caching to ensure admin admin always shows fresh data
        const conditions = [
            eq(products.tenantId, tenantId),
            isNull(products.deletedAt),
        ];

        if (storeId) conditions.push(eq(products.storeId, storeId));
        if (source) conditions.push(eq(products.source, source));
        if (search) conditions.push(like(products.productName, `%${search}%`));

        const whereClause = and(...conditions);

        const productList = await db.query.products.findMany({
            where: whereClause,
            with: {
                media: {
                    with: { media: true },
                    orderBy: (m, { asc }) => [asc(m.sortOrder)],
                    limit: 1,
                },
            },
            orderBy: [desc(products.createdAt)],
            limit,
            offset,
        });

        const countResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(products)
            .where(whereClause);

        const count = countResult[0]?.count ?? 0;

        const salesRows = productList.length
            ? await db
                .select({
                    productId: orderItems.productId,
                    salesAmount: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)::int`,
                })
                .from(orderItems)
                .innerJoin(orders, eq(orders.id, orderItems.orderId))
                .where(
                    and(
                        eq(orderItems.tenantId, tenantId),
                        eq(orders.paymentStatus, "paid"),
                        isNull(orders.deletedAt)
                    )
                )
                .groupBy(orderItems.productId)
            : [];

        const salesMap = new Map<string, number>();
        salesRows.forEach((row) => {
            if (row.productId) salesMap.set(row.productId, row.salesAmount || 0);
        });

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
        const { media, ...productData } = data;

        const [updated] = await db.update(products)
            .set({
                ...productData,
                updatedAt: new Date(),
            })
            .where(and(
                eq(products.id, id),
                eq(products.tenantId, tenantId),
                isNull(products.deletedAt)
            ))
            .returning();

        if (!updated) {
            throw new Error("Product not found");
        }

        if (media) {
            // Sync media
            // 1. Delete existing product media links for this product
            // (We could be more smart and diff them, but full replace is easier and safer for ordering)
            // Note: We don't delete the actual MediaObjects here unless we are sure they are orphaned and we want to clean up.
            // For now, just unlink.
            await db.delete(productMedia).where(and(
                eq(productMedia.productId, id),
                eq(productMedia.tenantId, tenantId)
            ));

            // 2. Re-attach or create media objects
            await Promise.all(media.map(async (m, index) => {
                // Check if mediaObject already exists by blobUrl or pathname
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
                    // Create new media object
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

                // Link to product
                await db.insert(productMedia).values({
                    tenantId,
                    productId: id,
                    mediaId,
                    sortOrder: index,
                    isFeatured: index === 0
                });
            }));
        }

        return this.getProductWithMedia(id, tenantId);
    },

    /**
     * Delete a product and its media
     */
    async deleteProduct(id: string, tenantId: string): Promise<void> {
        const product = await this.getProductWithMedia(id, tenantId);

        // Soft delete the product
        await db.update(products)
            .set({ deletedAt: new Date() })
            .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));

        // Delete uploaded media from UploadThing by file key
        const uploadedMedia = product.media.filter((m) => m.source === "upload");
        if (uploadedMedia.length > 0) {
            await mediaService.deleteFiles(
                uploadedMedia
                    .map((m) => m.blobPathname)
                    .filter((value): value is string => Boolean(value))
            );
        }
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
