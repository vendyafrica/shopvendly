import { Redis } from "@upstash/redis";

// Check for Redis credentials - gracefully degrade if not configured
const hasRedisConfig = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const cacheDebug = process.env.CACHE_DEBUG === "1";

if (cacheDebug) {
    console.log('[Cache] Redis config status:', {
        hasConfig: hasRedisConfig,
        url: process.env.UPSTASH_REDIS_REST_URL ? '✓ set' : '✗ missing',
        token: process.env.UPSTASH_REDIS_REST_TOKEN ? '✓ set' : '✗ missing',
    });
}

declare global {
    // eslint-disable-next-line no-var
    var __vendlyRedisClient: Redis | null | undefined;
}

// Create Redis client only if configured (singleton across dev module reloads)
const resolvedRedis = hasRedisConfig
    ? (globalThis.__vendlyRedisClient ??
        new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        }))
    : null;

if (hasRedisConfig) {
    globalThis.__vendlyRedisClient = resolvedRedis;
}

export const redis = resolvedRedis;

if (cacheDebug) {
    if (redis) {
        console.log('[Cache] ✓ Redis client initialized successfully');
    } else {
        console.log('[Cache] ✗ Redis client NOT initialized - caching disabled');
    }
}


// Default TTL values in seconds
export const TTL = {
    SHORT: 60, // 1 minute - for rapidly changing data
    MEDIUM: 300, // 5 minutes - for store listings, categories
    LONG: 900, // 15 minutes - for rarely changing data
    HOUR: 3600, // 1 hour - for static content
} as const;

// Cache key builders for consistent namespacing
export const cacheKeys = {
    // Store-related keys
    stores: {
        all: () => "stores:all",
        byId: (id: string) => `stores:id:${id}`,
        bySlug: (slug: string) => `stores:slug:${slug}`,
        byCategory: (category: string) => `stores:category:${category}`,
        products: (storeId: string) => `stores:${storeId}:products`,
    },

    // Product-related keys
    products: {
        list: (storeId: string, page?: number, filters?: string) =>
            `products:store:${storeId}:page:${page ?? 1}:${filters ?? "all"}`,
        byId: (id: string) => `products:id:${id}`,
        bySlug: (storeSlug: string, productSlug: string) =>
            `products:${storeSlug}:${productSlug}`,
    },

    // Order-related keys
    orders: {
        list: (tenantId: string, page?: number) =>
            `orders:tenant:${tenantId}:page:${page ?? 1}`,
        stats: (tenantId: string) => `orders:tenant:${tenantId}:stats`,
    },

    // Tenant-related keys
    tenant: {
        bootstrap: (tenantId: string) => `tenant:${tenantId}:bootstrap`,
        membership: (userId: string, tenantId?: string) =>
            `tenant:membership:${userId}:${tenantId ?? "any"}`,
    },

    // Marketplace keys
    marketplace: {
        homepage: () => "marketplace:homepage",
        categoryStores: (categorySlug: string) => `marketplace:category:${categorySlug}`,
    },
};

/**
 * Generic cache-aside helper
 * Tries to get from cache, falls back to fetcher, then caches result
 */
export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = TTL.MEDIUM
): Promise<T> {
    if (cacheDebug) console.log(`[Cache] withCache called for key: ${key}`);

    // If Redis is not configured, bypass cache
    if (!redis) {
        if (cacheDebug) console.log(`[Cache] BYPASS - Redis not configured, fetching directly`);
        return fetcher();
    }

    try {
        // Try to get from cache
        if (cacheDebug) console.log(`[Cache] Attempting to read from Redis...`);
        const cached = await redis.get<T>(key);
        if (cached !== null && cached !== undefined) {
            if (cacheDebug) console.log(`[Cache] HIT ✓ - Returning cached data for key: ${key}`);
            return cached;
        }
        if (cacheDebug) console.log(`[Cache] MISS - No cached data found for key: ${key}`);
    } catch (error) {
        // Log but don't fail - fallback to direct fetch
        console.error(`[Cache] READ ERROR for key ${key}:`, error);
    }

    // Fetch fresh data
    if (cacheDebug) console.log(`[Cache] Fetching fresh data...`);
    const data = await fetcher();

    // Cache the result (fire and forget)
    if (redis && data !== null && data !== undefined) {
        if (cacheDebug) console.log(`[Cache] Writing to Redis with TTL ${ttlSeconds}s...`);
        redis.setex(key, ttlSeconds, data).catch((error) => {
            console.error(`[Cache] WRITE ERROR for key ${key}:`, error);
        });
    }

    return data;
}


/**
 * Invalidate a single cache key
 */
export async function invalidateCache(key: string): Promise<void> {
    if (!redis) return;

    try {
        await redis.del(key);
    } catch (error) {
        console.warn(`Cache invalidation error for key ${key}:`, error);
    }
}

/**
 * Invalidate multiple cache keys matching a pattern
 * Note: Use sparingly as SCAN can be expensive
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
    if (!redis) return;

    try {
        // Use SCAN to find matching keys
        let cursor = 0;
        const keysToDelete: string[] = [];

        do {
            const [nextCursor, keys] = await redis.scan(cursor, {
                match: pattern,
                count: 100,
            });
            cursor = Number(nextCursor);
            keysToDelete.push(...keys);
        } while (cursor !== 0);

        // Delete all matching keys
        if (keysToDelete.length > 0) {
            await redis.del(...keysToDelete);
        }
    } catch (error) {
        console.warn(`Cache pattern invalidation error for ${pattern}:`, error);
    }
}

/**
 * Invalidate all cache keys for a specific store
 */
export async function invalidateStoreCache(storeId: string): Promise<void> {
    if (!redis) return;

    const keysToDelete = [
        cacheKeys.stores.byId(storeId),
        cacheKeys.stores.products(storeId),
        cacheKeys.stores.all(),
        cacheKeys.marketplace.homepage(),
    ];

    try {
        await redis.del(...keysToDelete);
    } catch (error) {
        console.warn(`Store cache invalidation error for ${storeId}:`, error);
    }
}

/**
 * Invalidate all cache keys for a specific product
 */
export async function invalidateProductCache(
    productId: string,
    storeId: string
): Promise<void> {
    if (!redis) return;

    const keysToDelete = [
        cacheKeys.products.byId(productId),
        cacheKeys.stores.products(storeId),
    ];

    try {
        await redis.del(...keysToDelete);
        // Also invalidate paginated product lists
        await invalidateCachePattern(`products:store:${storeId}:*`);
    } catch (error) {
        console.warn(`Product cache invalidation error for ${productId}:`, error);
    }
}

/**
 * Check if caching is available
 */
export function isCacheAvailable(): boolean {
    return redis !== null;
}
