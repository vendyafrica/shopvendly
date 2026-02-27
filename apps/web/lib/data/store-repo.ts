import { db, stores, eq, and, drizzleSql as sql } from "@shopvendly/db";

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
            // Production safety: if app code expects a column that doesn't exist yet in the DB,
            // avoid crashing the homepage and treat it as "no stores".
            if (isUndefinedColumnError(error)) {
                return [];
            }
            throw error;
        }
    },

    async findBySlug(slug: string) {
        return db.query.stores.findFirst({
            where: eq(stores.slug, slug),
        });
    },

    async findActiveBySlug(slug: string) {
        return db.query.stores.findFirst({
            where: and(eq(stores.slug, slug), eq(stores.status, true)),
        });
    },

    // Find stores that have a specific category in their categories array.
    // NOTE: In practice, stores.categories may contain either category slugs (e.g. "women")
    // or category names (e.g. "Women"). Use array overlap to match either.
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

    async create(data: typeof stores.$inferInsert) {
        const [store] = await db.insert(stores).values(data).returning();
        return store;
    },

    async update(id: string, tenantId: string, data: Partial<typeof stores.$inferInsert>) {
        const [updated] = await db
            .update(stores)
            .set({ ...data, updatedAt: new Date() })
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
