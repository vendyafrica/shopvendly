import { storeRepo } from "../data/store-repo";
import { productRepo } from "../data/product-repo";
import { type NewStore } from "@shopvendly/db/schema";

/**
 * Store Service for serverless environment
 */
export const storeService = {
    /**
     * Find store by ID
     */
    async findById(id: string) {
        return storeRepo.findById(id); // NOTE: findById missing in repo? check below
    },

    /**
     * Find store by slug
     */
    async findBySlug(slug: string) {
        return storeRepo.findBySlug(slug);
    },

    /**
     * Get Public Store Details (Store + Products)
     */
    async getStoreDetails(slug: string) {
        const store = await storeRepo.findActiveBySlug(slug);

        if (!store) {
            return null;
        }

        const products = await productRepo.findByStoreId(store.id);

        return {
            ...store,
            products: products || []
        };
    },

    /**
     * Find stores by tenant ID
     */
    async findByTenantId(tenantId: string) {
        return storeRepo.findByTenantId(tenantId);
    },

    /**
     * Create a new store
     */
    async create(data: NewStore) {
        return storeRepo.create(data);
    },

    /**
     * Update a store
     */
    async update(id: string, tenantId: string, data: Partial<NewStore>) {
        return storeRepo.update(id, tenantId, data);
    },

    /**
     * Soft delete a store
     */
    async delete(id: string, tenantId: string) {
        return storeRepo.delete(id, tenantId);
    },

    /**
     * Update store status
     */
    async updateStatus(id: string, tenantId: string, status: boolean) {
        // Note: New schema uses boolean for status? 
        // Original file had status "draft" | "active" ... but schema says boolean.
        // Checking schema: status: boolean("status").notNull().default(false)
        // So the original service file likely had type error or outdated logic.
        // We will stick to schema type which is BOOLEAN.

        // Wait, looking at schema again:
        // status: boolean("status").notNull().default(false),

        return storeRepo.update(id, tenantId, { status });
    },
};
