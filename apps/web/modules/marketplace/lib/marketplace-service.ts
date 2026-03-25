import { categoryRepo } from "@/repo/category-repo";
import { storeRepo } from "@/repo/store-repo";
import { withCache, cacheKeys, TTL } from "@shopvendly/db";



export interface StoreWithCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl?: string | null;
    instagramAvatarUrl?: string | null;
    categories: string[];
    heroMedia?: string[];
    images?: string[];
    mediaItems?: { url: string; contentType: string | null }[];
}

function slugifyName(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

type ProductMediaRow = { media?: { url?: string | null; blobUrl?: string | null; contentType?: string | null } | null };
type ProductRecordForMarketplace = {
    id: string;
    slug: string | null;
    productName: string;
    description: string | null;
    priceAmount: unknown;
    currency: string;
    media?: ProductMediaRow[];
};


function mapProductRecord(product: ProductRecordForMarketplace, store: { id: string; name: string; slug: string; logoUrl?: string | null }) {
    const slug = product.slug || slugifyName(product.productName || "");
    const description = product.description as string | null | undefined;
    const priceAmount = Number(product.priceAmount || 0);
    const mediaList = Array.isArray(product.media) ? product.media : [];
    const images = mediaList
        .map((m) => m?.media?.url || m?.media?.blobUrl)
        .filter(Boolean) as string[];

    const mediaItems = mediaList
        .map((m) => ({
            url: m?.media?.url || m?.media?.blobUrl,
            contentType: m?.media?.contentType || null,
        }))
        .filter((m) => m.url) as { url: string; contentType: string | null }[];

    return {
        id: product.id,
        slug,
        name: product.productName,
        description,
        price: priceAmount,
        currency: product.currency,
        images,
        mediaItems,
        store: {
            id: store.id,
            name: store.name,
            slug: store.slug,
            logoUrl: store.logoUrl ?? null,
        },
    };
}

export interface MarketplaceSearchResult {
    stores: Array<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        logoUrl: string | null;
        categories: string[];
    }>;
    products: Array<{
        id: string;
        name: string;
        slug: string;
        price: number;
        currency: string;
        image: string | null;
        store: { slug: string; name: string } | null;
    }>;
}

/**
 * Detect if a URL points to a video based on common extensions
 */
function isVideoUrl(url: string): boolean {
    const lower = url.toLowerCase();
    // Check for common video extensions
    const hasVideoExtension = [".mp4", ".mov", ".webm", ".avi", ".m4v", ".mkv"].some((ext) => lower.includes(ext));
    // Check for query parameters often used by storage providers (like UploadThing/S3)
    const hasVideoQueryParam = lower.includes("video") || lower.includes("quicktime");

    return hasVideoExtension || hasVideoQueryParam;
}

/**
 * Batch fetch product images for multiple stores to avoid N+1 queries
 */
async function batchFetchStoreProductImages(storeIds: string[]): Promise<Map<string, { url: string; contentType: string | null }[]>> {
    if (storeIds.length === 0) return new Map();
    const { db, products, inArray } = await import("@shopvendly/db");

    // Fetch all products with media for the given stores in one query
    const productsWithMedia = await db.query.products.findMany({
        where: inArray(products.storeId, storeIds),
        columns: { id: true, storeId: true },
        with: {
            media: {
                limit: 5,
                with: {
                    media: {
                        columns: { blobUrl: true, contentType: true }
                    }
                }
            }
        }
    });

    // Group media items by store
    const storeImages = new Map<string, { url: string; contentType: string | null }[]>();
    for (const product of productsWithMedia as any[]) {
        const existingImages = storeImages.get(product.storeId) || [];
        const productMedia = (product.media ?? [])
            .map((m: any) => ({ url: m?.media?.blobUrl as string | null, contentType: m?.media?.contentType as string | null }))
            .filter((item: { url: string | null; contentType: string | null }): item is { url: string; contentType: string | null } =>
                Boolean(item.url) && typeof item.url === "string" && item.url.trim() !== ""
            );

        // Limit to 5 items per store
        const combined = [...existingImages, ...productMedia].slice(0, 5);
        storeImages.set(product.storeId, combined);
    }

    return storeImages;
}

export const marketplaceService = {
    /**
     * Get all active stores with their categories
     * Uses caching with 5-minute TTL
     */
    async getAllStores(): Promise<StoreWithCategory[]> {
        return withCache(
            cacheKeys.marketplace.homepage(),
            async () => {
                const stores = await storeRepo.findActiveStores();

                // Fetch Instagram accounts to get profile pictures
                const { db, instagramAccounts, eq } = await import("@shopvendly/db");
                const igAccounts = await db
                    .select({
                        tenantId: instagramAccounts.tenantId,
                        profilePictureUrl: instagramAccounts.profilePictureUrl
                    })
                    .from(instagramAccounts)
                    .where(eq(instagramAccounts.isActive, true));

                const igMap = new Map(igAccounts.map(ig => [ig.tenantId, ig.profilePictureUrl]));

                // Collect stores that need product images (no hero images)
                const storesNeedingImages: string[] = [];
                const storeHeroImages = new Map<string, string[]>();

                for (const store of stores) {
                    const heroImages = Array.isArray((store as { heroMedia?: unknown }).heroMedia)
                        ? (((store as { heroMedia?: unknown }).heroMedia as unknown[])?.filter((u) => typeof u === "string" && u.trim() !== "") as string[])
                        : [];

                    if (heroImages.length > 0) {
                        storeHeroImages.set(store.id, heroImages);
                    } else {
                        storesNeedingImages.push(store.id);
                    }
                }

                // Batch fetch product images for stores without hero images
                const productImages = await batchFetchStoreProductImages(storesNeedingImages);

                return stores.map((store) => {
                    const heroMedia = (store as { heroMedia?: string[] }).heroMedia ?? [];
                    const heroImages = heroMedia.filter((u) => typeof u === "string" && u.trim() !== "");

                    // Build ordered mediaItems: hero first, then product images for stores without hero
                    let mediaItems: { url: string; contentType: string | null }[];
                    if (heroImages.length > 0) {
                        // Map hero media: detect content type from URL extension
                        mediaItems = heroImages.map((url) => ({
                            url,
                            contentType: isVideoUrl(url) ? "video/mp4" : "image/jpeg",
                        }));
                    } else {
                        mediaItems = productImages.get(store.id) || [];
                    }

                    // Keep backward-compat images array
                    const images = mediaItems.map((m) => m.url);

                    return {
                        id: store.id,
                        name: store.name,
                        slug: store.slug,
                        description: store.description,
                        logoUrl: store.logoUrl ?? null,
                        instagramAvatarUrl: igMap.get(store.tenantId) ?? null,
                        categories: store.categories || [],
                        heroMedia,
                        images,
                        mediaItems,
                    };
                });
            },
            TTL.SHORT // 1 minute
        );
    },


    /**
     * Get stores grouped by category
     * Note: This is still doing some in-memory grouping which is fine for the home page 
     * if the number of stores is reasonable. For high scale, we'd paginate or query differently.
     */
    async getHomePageData() {
        const categories = await categoryRepo.findAll();
        const stores = await this.getAllStores();

        const storesByCategory: Record<string, StoreWithCategory[]> = {};

        // Pre-fill categories to ensure specific order if needed, or just let them fill naturally
        // For now, adhering to the requested flow of "All store categories... Stores grouped by category"

        // Pivot stores to categories
        for (const store of stores) {
            for (const category of store.categories) {
                if (!storesByCategory[category]) {
                    storesByCategory[category] = [];
                }
                storesByCategory[category].push(store);
            }
        }

        return {
            categories,
            stores, // Expose flat list of stores
            storesByCategory
        };
    },

    /**
     * Get stores for a specific category
     */
    async getStoresBySpecificCategory(categorySlug: string): Promise<StoreWithCategory[]> {
        // First get the category to find its name to filter by name array
        const category = await categoryRepo.findBySlug(categorySlug);

        if (!category) {
            return [];
        }

        const stores = await storeRepo.findByCategory({ slug: category.slug, name: category.name });

        const { productRepo } = await import("@/repo/product-repo");

        return Promise.all(stores.map(async (store) => {
            const heroImages = Array.isArray((store as { heroMedia?: unknown }).heroMedia)
                ? (((store as { heroMedia?: unknown }).heroMedia as unknown[])?.filter((u) => typeof u === "string" && u.trim() !== "") as string[])
                : [];

            let images: string[] = heroImages;

            if (images.length === 0) {
                const products = await productRepo.findByStoreId(store.id);
                images = products
                    .flatMap((p: any) =>
                        (p.media ?? [])
                            .map((m: any) => m?.media?.url || m?.media?.blobUrl)
                            .filter((u: any): u is string => typeof u === "string" && u.trim() !== "")
                    )
                    .slice(0, 5);
            }

            return {
                id: store.id,
                name: store.name,
                slug: store.slug,
                description: store.description,
                logoUrl: store.logoUrl ?? null,
                categories: store.categories || [],
                heroMedia: (store as { heroMedia?: string[] }).heroMedia ?? [],
                images,
            };
        }));
    },

    async getSubcategoriesByParentSlug(parentSlug: string): Promise<Array<{ id: string; name: string; slug: string; image: string | null }> | null> {
        const parentCategory = await categoryRepo.findBySlug(parentSlug);
        if (!parentCategory) return null;

        const allCategories = await categoryRepo.findAll();

        return allCategories
            .filter((category) => category.parentId === parentCategory.id)
            .map((subcategory) => ({
                id: subcategory.id,
                name: subcategory.name,
                slug: subcategory.slug,
                image: subcategory.image ?? parentCategory.image ?? null,
            }));
    },

    async getStoreDetails(slug: string) {
        return withCache(
            cacheKeys.stores.bySlug(slug),
            async () => {
                const store = await storeRepo.findBySlug(slug);
                if (!store) return null;

                return {
                    id: store.id,
                    name: store.name,
                    slug: store.slug,
                    description: store.description,
                    logoUrl: store.logoUrl ?? null,
                    heroMedia: (store as { heroMedia?: string[] }).heroMedia ?? [],
                };
            },
            TTL.SHORT
        );
    },


    async getStoreProducts(slug: string, query?: string) {
        const store = await this.getStoreDetails(slug);
        if (!store) return [];

        const normalizedQuery = query?.trim().toLowerCase() || "";
        const cacheKey = cacheKeys.products.list(store.id, 1, normalizedQuery ? `q=${normalizedQuery}` : "all");

        return withCache(
            cacheKey,
            async () => {
                // Dynamic import to avoid circular dependency
                const { productRepo } = await import("@/repo/product-repo");
                const products = await productRepo.findByStoreId(store.id);

                const filtered = normalizedQuery
                    ? products.filter((p) => p.productName?.toLowerCase().includes(normalizedQuery))
                    : products;

                return filtered.map((p: any) => ({
                    id: p.id,
                    slug: p.slug || p.productName.toLowerCase().replace(/\s+/g, "-"),
                    name: p.productName,
                    price: Number(p.priceAmount || 0),
                    currency: p.currency,
                    // Extract first image from media relation if available
                    image: p.media?.[0]?.media?.blobUrl || null,
                    contentType: p.media?.[0]?.media?.contentType || null,
                }));
            },
            TTL.SHORT
        );
    },

    async getStoreProductsByCategorySlug(storeSlug: string, categorySlug: string, query?: string) {
        const store = await this.getStoreDetails(storeSlug);
        if (!store) return [];

        const normalizedQuery = query?.trim().toLowerCase() || "";
        const cacheKey = cacheKeys.products.list(
            store.id,
            1,
            `category=${categorySlug}${normalizedQuery ? `&q=${normalizedQuery}` : ""}`
        );

        return withCache(
            cacheKey,
            async () => {
                const { db, and, eq, products, productCategories, categories } = await import("@shopvendly/db");

                const matches = await db
                    .select({ id: products.id })
                    .from(products)
                    .innerJoin(productCategories, eq(productCategories.productId, products.id))
                    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
                    .where(
                        and(
                            eq(products.storeId, store.id),
                            eq(products.status, "active"),
                            eq(categories.slug, categorySlug)
                        )
                    );

                const ids = new Set(matches.map((m) => m.id));
                if (ids.size === 0) return [];

                const { productRepo } = await import("@/repo/product-repo");
                const productsForStore = await productRepo.findByStoreId(store.id);

                const filteredByCategory = productsForStore.filter((p) => ids.has(p.id));

                const filtered = normalizedQuery
                    ? filteredByCategory.filter((p) => p.productName?.toLowerCase().includes(normalizedQuery))
                    : filteredByCategory;

                return filtered.map((p: any) => ({
                    id: p.id,
                    slug: p.slug || p.productName.toLowerCase().replace(/\s+/g, "-"),
                    name: p.productName,
                    price: Number(p.priceAmount || 0),
                    currency: p.currency,
                    image: p.media?.[0]?.media?.blobUrl || null,
                    contentType: p.media?.[0]?.media?.contentType || null,
                }));
            },
            TTL.SHORT
        );
    },

    async getStoreProduct(storeSlug: string, productSlug: string) {
        const store = await this.getStoreDetails(storeSlug);
        if (!store) return null;

        const { productRepo } = await import("@/repo/product-repo");
        // Optimization: Ideally repo has findOneBySlug. For now, we fetch all and find.
        // This mirrors storefrontService logic but we should improve repo later.
        const products = await productRepo.findByStoreId(store.id);

        const product = products.find((p: any) => {
            const slug = p.slug || p.productName.toLowerCase().replace(/\s+/g, "-");
            return slug === productSlug;
        });

        if (!product) return null;

        const mapped = mapProductRecord(product, store);

        return {
            ...mapped,
        };
    },

    async getStoreProductBySlug(storeSlug: string, productSlug: string) {
        // Alias to keep symmetry with storefrontService; ensures slug-only routes can reuse this service
        return this.getStoreProduct(storeSlug, productSlug);
    },

    async getStoreProductById(storeSlug: string, productId: string) {
        const store = await this.getStoreDetails(storeSlug);
        if (!store) return null;

        const { productRepo } = await import("@/repo/product-repo");
        const product = (await productRepo.findById(productId)) as (ProductRecordForMarketplace & { storeId: string; status?: string }) | null;
        if (!product) return null;

        // Ensure product belongs to store and is active
        if (product.storeId !== store.id) return null;
        if ((product as { status?: string }).status && (product as { status?: string }).status !== "active") return null;

        const mapped = mapProductRecord(product, store);
        return {
            ...mapped,
        };
    },

    /**
     * Full marketplace text search (stores + products) by name/description (case-insensitive LIKE)
     */
    async searchMarketplace(query: string, options?: { storeLimit?: number; productLimit?: number; includeDescriptions?: boolean }): Promise<MarketplaceSearchResult> {
        const trimmed = query.trim();
        if (!trimmed) return { stores: [], products: [] };

        const storeLimit = options?.storeLimit ?? 12;
        const productLimit = options?.productLimit ?? 20;
        const includeDescriptions = options?.includeDescriptions ?? false;

        const pattern = `%${trimmed.toLowerCase()}%`;

        const { db, stores, products, isNull, and, or, eq, sql } = await import("@shopvendly/db");

        const buildLike = (column: unknown, coalesceEmpty = false) =>
            coalesceEmpty
                ? sql`lower(coalesce(${column}, '')) like ${pattern}`
                : sql`lower(${column}) like ${pattern}`;

        const storeWhere = includeDescriptions
            ? and(
                eq(stores.status, true),
                or(
                    buildLike(stores.name),
                    buildLike(stores.description, true)
                ),
                isNull(stores.deletedAt)
            )
            : and(
                eq(stores.status, true),
                buildLike(stores.name),
                isNull(stores.deletedAt)
            );

        const [storeResults, productResults] = await Promise.all([
            db.query.stores.findMany({
                where: storeWhere,
                limit: storeLimit,
            }),
            db.query.products.findMany({
                where: and(
                    eq(products.status, "active"),
                    buildLike(products.productName),
                    isNull(products.deletedAt)
                ),
                limit: productLimit,
                with: {
                    store: true,
                    media: {
                        with: { media: true },
                        orderBy: (media, { asc }) => [asc(media.sortOrder)],
                        limit: 1,
                    },
                },
            })
        ]);

        return {
            stores: storeResults.map((s) => {
                const heroMedia = (s as any).heroMedia || [];
                const heroImages = heroMedia.filter((u: any) => typeof u === "string" && u.trim() !== "");
                
                // Map hero media: detect content type from URL extension
                const mediaItems = heroImages.map((url: string) => ({
                    url,
                    contentType: isVideoUrl(url) ? "video/mp4" : "image/jpeg",
                }));

                // Fallback images array
                const images = mediaItems.map((m: any) => m.url);

                return {
                    id: s.id,
                    name: s.name,
                    slug: s.slug,
                    description: s.description,
                    logoUrl: s.logoUrl ?? null,
                    images,
                    heroMedia,
                    mediaItems,
                    categories: s.categories || [],
                };
            }),
            products: productResults.map((p) => ({
                id: p.id,
                name: p.productName,
                slug: p.slug,
                price: Number(p.priceAmount ?? 0),
                currency: p.currency,
                image: (p.media?.[0]?.media as any)?.url || p.media?.[0]?.media?.blobUrl || null,
                contentType: p.media?.[0]?.media?.contentType || null,
                store: p.store ? { slug: p.store.slug, name: p.store.name } : null,
            })),
        };
    }
};
