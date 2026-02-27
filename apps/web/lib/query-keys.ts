/**
 * Centralized query key definitions for React Query
 * This ensures consistent cache invalidation across the app
 */
export const queryKeys = {
    // Products
    products: {
        all: ["products"] as const,
        lists: () => [...queryKeys.products.all, "list"] as const,
        list: (storeId: string, filters?: Record<string, unknown>) =>
            [...queryKeys.products.lists(), storeId, filters] as const,
        details: () => [...queryKeys.products.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.products.details(), id] as const,
    },

    // Orders
    orders: {
        all: ["orders"] as const,
        lists: () => [...queryKeys.orders.all, "list"] as const,
        list: (tenantId: string, filters?: Record<string, unknown>) =>
            [...queryKeys.orders.lists(), tenantId, filters] as const,
        details: () => [...queryKeys.orders.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.orders.details(), id] as const,
        stats: (tenantId: string) =>
            [...queryKeys.orders.all, "stats", tenantId] as const,
    },

    // Stores
    stores: {
        all: ["stores"] as const,
        lists: () => [...queryKeys.stores.all, "list"] as const,
        list: (filters?: Record<string, unknown>) =>
            [...queryKeys.stores.lists(), filters] as const,
        details: () => [...queryKeys.stores.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.stores.details(), id] as const,
        bySlug: (slug: string) => [...queryKeys.stores.all, "slug", slug] as const,
    },

    // Categories
    categories: {
        all: ["categories"] as const,
        list: () => [...queryKeys.categories.all, "list"] as const,
    },

    // Marketplace
    marketplace: {
        all: ["marketplace"] as const,
        homepage: () => [...queryKeys.marketplace.all, "homepage"] as const,
        category: (slug: string) =>
            [...queryKeys.marketplace.all, "category", slug] as const,
    },

    // Cart
    cart: {
        all: ["cart"] as const,
        items: (storeSlug: string) =>
            [...queryKeys.cart.all, "items", storeSlug] as const,
    },
};
