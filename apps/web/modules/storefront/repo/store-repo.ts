import { db, stores, eq, and, isNull, drizzleSql as sql } from "@shopvendly/db";

function isUndefinedColumnError(error: unknown): boolean {
    const err = error as { code?: string; cause?: { code?: string }; message?: string };
    const code = err?.cause?.code || err?.code;
    if (code === "42703") return true;
    return typeof err?.message === "string" && err.message.toLowerCase().includes("does not exist");
}

export const storeRepo = {
    async findById(id: string) {
        return db.query.stores.findFirst({
            where: eq(stores.id, id),
        });
    },

    async findActiveStores() {
        try {
            return await db
                .select()
                .from(stores)
                .where(eq(stores.status, true));
        } catch (error) {
            if (isUndefinedColumnError(error)) {
                return [];
            }
            throw error;
        }
    },

    async findAdminBySlug(slug: string) {
        try {
            return await db.query.stores.findFirst({
                where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
                columns: {
                    id: true,
                    tenantId: true,
                    name: true,
                    description: true,
                    defaultCurrency: true,
                    logoUrl: true,
                    heroMedia: true,
                    slug: true,
                    collectoPassTransactionFeeToCustomer: true,
                    collectoPayoutMode: true,
                    storeAddress: true,
                    categories: true,
                },
            });
        } catch (error) {
            if (!isUndefinedColumnError(error)) {
                throw error;
            }

            const fallback = await db.query.stores.findFirst({
                where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
                columns: {
                    id: true,
                    tenantId: true,
                    name: true,
                    description: true,
                    defaultCurrency: true,
                    logoUrl: true,
                    heroMedia: true,
                    slug: true,
                },
            });

            return fallback
                ? {
                    ...fallback,
                    collectoPassTransactionFeeToCustomer: false,
                    collectoPayoutMode: "automatic_per_order" as const,
                }
                : null;
        }
    },

    async findAdminManyBySlug(slug: string) {
        try {
            return await db.query.stores.findMany({
                where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
                columns: {
                    id: true,
                    tenantId: true,
                    name: true,
                    description: true,
                    defaultCurrency: true,
                    logoUrl: true,
                    slug: true,
                    collectoPassTransactionFeeToCustomer: true,
                    collectoPayoutMode: true,
                },
            });
        } catch (error) {
            if (!isUndefinedColumnError(error)) {
                throw error;
            }

            const fallback = await db.query.stores.findMany({
                where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
                columns: {
                    id: true,
                    tenantId: true,
                    name: true,
                    description: true,
                    defaultCurrency: true,
                    logoUrl: true,
                    slug: true,
                },
            });

            return fallback.map((store) => ({
                ...store,
                collectoPassTransactionFeeToCustomer: false,
                collectoPayoutMode: "automatic_per_order" as const,
            }));
        }
    },

    async findBySlug(slug: string) {
        return db.query.stores.findFirst({
            where: eq(stores.slug, slug),
        });
    },

    async findByCategory(category: { slug: string; name: string }) {
        try {
            return await db
                .select()
                .from(stores)
                .where(
                    and(
                        eq(stores.status, true),
                        sql`${stores.categories} && ARRAY[${category.slug}, ${category.name}]::text[]`
                    )
                );
        } catch (error) {
            if (isUndefinedColumnError(error)) {
                return [];
            }
            throw error;
        }
    },

    async findByTenantId(tenantId: string) {
        return db.query.stores.findMany({
            where: eq(stores.tenantId, tenantId),
        });
    },

    async findByIdAndTenant(id: string, tenantId: string) {
        return db.query.stores.findFirst({
            where: and(eq(stores.id, id), eq(stores.tenantId, tenantId), isNull(stores.deletedAt)),
            columns: { id: true, slug: true, defaultCurrency: true, tenantId: true },
        });
    },

    async findActiveByTenantId(tenantId: string) {
        return db.query.stores.findFirst({
            where: and(eq(stores.tenantId, tenantId), eq(stores.status, true)),
        });
    },

    async findFirstByTenantId(tenantId: string) {
        return db.query.stores.findFirst({
            where: and(eq(stores.tenantId, tenantId), isNull(stores.deletedAt)),
            columns: { slug: true },
        });
    },

    async create(data: typeof stores.$inferInsert) {
        const [store] = await db.insert(stores).values(data).returning();
        return store;
    },

    async findAdminByStoreId(id: string) {
        try {
            return await db.query.stores.findFirst({
                where: and(eq(stores.id, id), isNull(stores.deletedAt)),
                columns: {
                    id: true,
                    tenantId: true,
                    name: true,
                    description: true,
                    defaultCurrency: true,
                    logoUrl: true,
                    heroMedia: true,
                    slug: true,
                    collectoPassTransactionFeeToCustomer: true,
                    collectoPayoutMode: true,
                },
            });
        } catch (error) {
            if (!isUndefinedColumnError(error)) {
                throw error;
            }

            const fallback = await db.query.stores.findFirst({
                where: and(eq(stores.id, id), isNull(stores.deletedAt)),
                columns: {
                    id: true,
                    tenantId: true,
                    name: true,
                    description: true,
                    defaultCurrency: true,
                    logoUrl: true,
                    heroMedia: true,
                    slug: true,
                },
            });

            return fallback
                ? {
                    ...fallback,
                    collectoPassTransactionFeeToCustomer: false,
                    collectoPayoutMode: "automatic_per_order" as const,
                }
                : null;
        }
    },

    async findAdminSettingsBySlug(slug: string) {
        try {
            return await db.query.stores.findFirst({
                where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
                columns: {
                    id: true,
                    name: true,
                    storeContactPhone: true,
                    defaultCurrency: true,
                    slug: true,
                    tenantId: true,
                    heroMedia: true,
                    logoUrl: true,
                    storePolicy: true,
                    collectoPassTransactionFeeToCustomer: true,
                    collectoPayoutMode: true,
                },
            });
        } catch (error) {
            if (!isUndefinedColumnError(error)) {
                throw error;
            }

            const fallback = await db.query.stores.findFirst({
                where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
                columns: {
                    id: true,
                    name: true,
                    storeContactPhone: true,
                    defaultCurrency: true,
                    slug: true,
                    tenantId: true,
                    heroMedia: true,
                    logoUrl: true,
                    storePolicy: true,
                },
            });

            return fallback
                ? {
                    ...fallback,
                    collectoPassTransactionFeeToCustomer: false,
                    collectoPayoutMode: "automatic_per_order" as const,
                }
                : null;
        }
    },

    async update(id: string, tenantId: string, data: Partial<typeof stores.$inferInsert>) {
        const [updated] = await db
            .update(stores)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(stores.id, id), eq(stores.tenantId, tenantId)))
            .returning();
        return updated;
    },

    async updateHeroMedia(id: string, tenantId: string, heroMedia: string[]) {
        const [updated] = await db
            .update(stores)
            .set({ heroMedia, updatedAt: new Date() })
            .where(and(eq(stores.id, id), eq(stores.tenantId, tenantId)))
            .returning();
        return updated;
    },

    async delete(id: string, tenantId: string) {
        await db
            .update(stores)
            .set({ deletedAt: new Date() })
            .where(and(eq(stores.id, id), eq(stores.tenantId, tenantId)));
    }
};
