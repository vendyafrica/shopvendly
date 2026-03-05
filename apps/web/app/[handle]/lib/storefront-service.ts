import {
    db,
    stores,
    products,
    productRatings,
    storeCollections,
    productCollections,
    eq,
    and,
    isNull,
    instagramAccounts,
    inArray,
    sql,
    tenants,
    asc,
} from "@shopvendly/db";

const DEFAULT_STORE_LOGO = "/vendly.png";

/**
 * Storefront Service for serverless environment
 * Handles public store data queries (no auth required)
 */

async function findStoreBySlugFresh(slug: string) {
    const store = await db.query.stores.findFirst({
        where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
    });

    if (!store) return undefined;

    const igAccount = await db.query.instagramAccounts.findFirst({
        where: and(eq(instagramAccounts.tenantId, store.tenantId), eq(instagramAccounts.isActive, true))
    });

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, store.tenantId),
        columns: { status: true, onboardingStep: true },
    });

    const claimable = tenant?.status === "onboarding" || tenant?.onboardingStep !== "complete";

    if (igAccount?.profilePictureUrl) {
        return { ...store, logoUrl: igAccount.profilePictureUrl, claimable };
    }

    return { ...store, logoUrl: store.logoUrl ?? DEFAULT_STORE_LOGO, claimable };
}

function slugifyName(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function resolveProductSlug(product: { slug: string | null; productName: string }): string {
    return product.slug || slugifyName(product.productName || "");
}

type RatingAggregate = { average: number; count: number };

async function getRatingsMap(productIds: string[]): Promise<Map<string, RatingAggregate>> {
    if (productIds.length === 0) return new Map();

    const rows = await db
        .select({
            productId: productRatings.productId,
            average: sql<number>`avg(${productRatings.rating})`,
            count: sql<number>`count(${productRatings.id})`,
        })
        .from(productRatings)
        .where(inArray(productRatings.productId, productIds))
        .groupBy(productRatings.productId);

    return new Map(rows.map((row) => [row.productId, { average: Number(row.average) || 0, count: Number(row.count) || 0 }]));
}

export const storefrontService = {
    /**
     * Find store by slug
     */
    async findStoreBySlug(slug: string) {
        return findStoreBySlugFresh(slug);
    },

    async getStoreCollections(storeId: string, query?: string) {
        const normalizedQuery = query?.trim().toLowerCase() || "";

        const collections = await db.query.storeCollections.findMany({
            where: eq(storeCollections.storeId, storeId),
            columns: {
                id: true,
                name: true,
                slug: true,
                image: true,
                sortOrder: true,
            },
            orderBy: [asc(storeCollections.name)],
        });

        if (!normalizedQuery) return collections;

        return collections.filter(
            (collection) =>
                collection.name.toLowerCase().includes(normalizedQuery) ||
                collection.slug.toLowerCase().includes(normalizedQuery)
        );
    },

    /**
     * Get all products for a store
     */
    async getStoreProducts(storeId: string, query?: string) {
        const normalizedQuery = query?.trim().toLowerCase() || "";

        const productsForStore = await db.query.products.findMany({
            where: and(
                eq(products.storeId, storeId),
                eq(products.status, "active"),
                isNull(products.deletedAt)
            ),
            columns: {
                id: true,
                slug: true,
                productName: true,
                description: true,
                priceAmount: true,
                currency: true,
                quantity: true,
            },
            with: {
                media: {
                    with: { media: true },
                    orderBy: (media, { asc }) => [asc(media.sortOrder)],
                    limit: 1,
                },
            },
        });

        const ratingMap = await getRatingsMap(productsForStore.map((p) => p.id));

        const filtered = normalizedQuery
            ? productsForStore.filter((product) => product.productName?.toLowerCase().includes(normalizedQuery))
            : productsForStore;

        return filtered.map((product) => {
            const rating = ratingMap.get(product.id);
            return {
                ...product,
                rating: rating?.average ?? 0,
                ratingCount: rating?.count ?? 0,
            };
        });
    },

    /**
     * Get a single product by slug for a store
     */
    async getStoreProductBySlug(storeId: string, productSlug: string) {
        const bySlug = await db.query.products.findFirst({
            where: and(
                eq(products.storeId, storeId),
                eq(products.status, "active"),
                isNull(products.deletedAt),
                eq(products.slug, productSlug)
            ),
            with: {
                media: {
                    with: { media: true },
                    orderBy: (media, { asc }) => [asc(media.sortOrder)],
                },
            },
        });

        if (bySlug) {
            const ratingMap = await getRatingsMap([bySlug.id]);
            const rating = ratingMap.get(bySlug.id);

            return {
                ...bySlug,
                rating: rating?.average ?? 0,
                ratingCount: rating?.count ?? 0,
            };
        }

        const fallbackProducts = await db.query.products.findMany({
            where: and(
                eq(products.storeId, storeId),
                eq(products.status, "active"),
                isNull(products.deletedAt)
            ),
            columns: {
                id: true,
                slug: true,
                productName: true,
                description: true,
                priceAmount: true,
                currency: true,
                quantity: true,
            },
            with: {
                media: {
                    with: { media: true },
                    orderBy: (media, { asc }) => [asc(media.sortOrder)],
                },
            },
        });

        const match = fallbackProducts.find((product) => resolveProductSlug(product) === productSlug);

        if (!match) return undefined;

        const ratingMap = await getRatingsMap([match.id]);
        const rating = ratingMap.get(match.id);

        return {
            ...match,
            rating: rating?.average ?? 0,
            ratingCount: rating?.count ?? 0,
        };
    },

    async getStoreProductWithRating(storeId: string, productSlug: string) {
        const product = await this.getStoreProductBySlug(storeId, productSlug);
        if (!product) return undefined;

        const ratingMap = await getRatingsMap([product.id]);
        const rating = ratingMap.get(product.id);

        return {
            ...product,
            rating: rating?.average ?? 0,
            ratingCount: rating?.count ?? 0,
        };
    },

    async getStoreRatingAggregate(storeId: string) {
        const rows = await db
            .select({
                average: sql<number>`avg(${productRatings.rating})`,
                count: sql<number>`count(${productRatings.id})`,
            })
            .from(productRatings)
            .innerJoin(products, eq(products.id, productRatings.productId))
            .where(eq(products.storeId, storeId));

        const row = rows[0];
        return {
            rating: row ? Number(row.average) || 0 : 0,
            ratingCount: row ? Number(row.count) || 0 : 0,
        };
    },

    async getStoreProductsByCategorySlug(storeId: string, categorySlug: string, query?: string) {
        return this.getStoreProductsByCollectionSlug(storeId, categorySlug, query);
    },

    async getStoreProductsByCollectionSlug(storeId: string, collectionSlug: string, query?: string) {
        const normalizedQuery = query?.trim().toLowerCase() || "";

        const matches = await db
            .select({ id: products.id })
            .from(products)
            .innerJoin(productCollections, eq(productCollections.productId, products.id))
            .innerJoin(storeCollections, eq(storeCollections.id, productCollections.collectionId))
            .where(
                and(
                    eq(products.storeId, storeId),
                    eq(products.status, "active"),
                    isNull(products.deletedAt),
                    eq(storeCollections.slug, collectionSlug)
                )
            );

        const ids = matches.map((match) => match.id);
        if (ids.length === 0) return [];

        const productsForStore = await db.query.products.findMany({
            where: and(inArray(products.id, ids), eq(products.status, "active"), isNull(products.deletedAt)),
            columns: {
                id: true,
                slug: true,
                productName: true,
                description: true,
                priceAmount: true,
                currency: true,
                quantity: true,
            },
            with: {
                media: {
                    with: { media: true },
                    orderBy: (media, { asc }) => [asc(media.sortOrder)],
                    limit: 1,
                },
            },
        });

        const ratingMap = await getRatingsMap(productsForStore.map((p) => p.id));

        const filtered = normalizedQuery
            ? productsForStore.filter((product) => product.productName?.toLowerCase().includes(normalizedQuery))
            : productsForStore;

        return filtered.map((product) => {
            const rating = ratingMap.get(product.id);
            return {
                ...product,
                rating: rating?.average ?? 0,
                ratingCount: rating?.count ?? 0,
            };
        });
    }
};
