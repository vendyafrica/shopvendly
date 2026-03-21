import { db } from "@shopvendly/db/db";
import { tenants, stores, users, categories, type NewCategory } from "@shopvendly/db/schema";
import { desc, sql, eq } from "@shopvendly/db";

export const adminService = {
    async getAllTenants() {
        const tenantList = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
        const stats = await this.getTenantStats();
        return { tenants: tenantList, stats };
    },

    async getTenantStats() {
        const [total] = await db.select({ count: sql<number>`count(*)` }).from(tenants);
        return {
            totalTenants: Number(total?.count || 0),
            newThisMonth: 0,
            activePlans: 0,
        };
    },

    async getAllStores() {
        const storeList = await db
            .select({
                id: stores.id,
                name: stores.name,
                slug: stores.slug,
                status: stores.status,
                storeContactPhone: stores.storeContactPhone,
                storeAddress: stores.storeAddress,
                createdAt: stores.createdAt,
                tenantName: tenants.fullName,
            })
            .from(stores)
            .leftJoin(tenants, eq(stores.tenantId, tenants.id))
            .orderBy(desc(stores.createdAt));

        const stats = await this.getStoreStats();
        return { stores: storeList, stats };
    },

    async getStoreStats() {
        const [total] = await db.select({ count: sql<number>`count(*)` }).from(stores);
        return {
            totalStores: Number(total?.count || 0),
            totalRevenue: 0,
            totalSales: 0,
        };
    },

    async getAllUsers() {
        return db.select().from(users).orderBy(desc(users.createdAt));
    },

    async getAllCategories() {
        return db.query.categories.findMany({
            with: {
                children: true,
            },
            where: (categories, { eq }) => eq(categories.level, 0),
        });
    },

    async createCategory(data: NewCategory) {
        const [created] = await db.insert(categories).values(data).returning();
        return created;
    },
};
