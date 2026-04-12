import { and, asc, count, eq, ilike, inArray, or, sql } from "@shopvendly/db";
import { db } from "@shopvendly/db/db";
import { productCollections, products, storeCollections, stores } from "@shopvendly/db/schema";

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const storeCollectionsRepo = {
  async listByStore(storeId: string, query?: string) {
    const normalizedQuery = query?.trim() || "";

    const whereClause = normalizedQuery
      ? and(
          eq(storeCollections.storeId, storeId),
          or(ilike(storeCollections.name, `%${normalizedQuery}%`), ilike(storeCollections.slug, `%${normalizedQuery}%`))
        )
      : eq(storeCollections.storeId, storeId);

    const collections = await db.query.storeCollections.findMany({
      where: whereClause,
      orderBy: [asc(storeCollections.name)],
      columns: {
        id: true,
        name: true,
        slug: true,
        image: true,
        sortOrder: true,
      },
    });

    const ids = collections.map((collection) => collection.id);
    const counts = ids.length
      ? await db
          .select({
            collectionId: productCollections.collectionId,
            total: count(productCollections.id),
          })
          .from(productCollections)
          .where(inArray(productCollections.collectionId, ids))
          .groupBy(productCollections.collectionId)
      : [];

    const countMap = new Map(counts.map((row) => [row.collectionId, Number(row.total) || 0]));

    return collections.map((collection) => ({
      ...collection,
      productCount: countMap.get(collection.id) ?? 0,
    }));
  },

  async findById(collectionId: string) {
    return db.query.storeCollections.findFirst({
      where: eq(storeCollections.id, collectionId),
    });
  },

  async findBasicById(collectionId: string) {
    return db.query.storeCollections.findFirst({
      where: eq(storeCollections.id, collectionId),
      columns: { id: true, storeId: true, tenantId: true, name: true },
    });
  },

  async findStoreSlugByStoreId(storeId: string) {
    return db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { slug: true },
    });
  },

  async findProductIdsByCollectionId(collectionId: string) {
    const links = await db.query.productCollections.findMany({
      where: eq(productCollections.collectionId, collectionId),
      columns: { productId: true },
    });

    return links.map((link) => link.productId);
  },

  async findValidProductsForCollection(storeId: string, tenantId: string, productIds: string[]) {
    if (productIds.length === 0) return [];

    return db.query.products.findMany({
      where: and(
        eq(products.storeId, storeId),
        eq(products.tenantId, tenantId),
        inArray(products.id, productIds)
      ),
      columns: { id: true },
    });
  },

  async replaceCollectionProducts(collectionId: string, productIds: string[]) {
    await db.delete(productCollections).where(eq(productCollections.collectionId, collectionId));

    if (productIds.length > 0) {
      await db.insert(productCollections).values(
        productIds.map((productId) => ({
          collectionId,
          productId,
        }))
      );
    }
  },

  async generateUniqueSlug(storeId: string, name: string, currentCollectionId: string) {
    const base = slugifyName(name) || "collection";
    let slug = base;
    let counter = 1;

    while (true) {
      const row = await db.query.storeCollections.findFirst({
        where: and(eq(storeCollections.storeId, storeId), eq(storeCollections.slug, slug)),
        columns: { id: true },
      });

      if (!row || row.id === currentCollectionId) {
        return slug;
      }

      slug = `${base}-${counter++}`;
    }
  },

  async generateUniqueSlugForCreate(storeId: string, name: string) {
    const base = slugifyName(name) || "collection";
    let slug = base;
    let counter = 1;

    while (
      await db.query.storeCollections.findFirst({
        where: and(eq(storeCollections.storeId, storeId), eq(storeCollections.slug, slug)),
        columns: { id: true },
      })
    ) {
      slug = `${base}-${counter++}`;
    }

    return slug;
  },

  async getNextSortOrder(storeId: string) {
    const sortRows = await db
      .select({ maxSort: sql<number>`COALESCE(MAX(${storeCollections.sortOrder}), -1)` })
      .from(storeCollections)
      .where(eq(storeCollections.storeId, storeId));

    return Number(sortRows[0]?.maxSort ?? -1) + 1;
  },

  async createCollection(payload: {
    tenantId: string;
    storeId: string;
    name: string;
    slug: string;
    image?: string | null;
    sortOrder: number;
  }) {
    const [created] = await db
      .insert(storeCollections)
      .values({
        tenantId: payload.tenantId,
        storeId: payload.storeId,
        name: payload.name,
        slug: payload.slug,
        image: payload.image ?? null,
        sortOrder: payload.sortOrder,
      })
      .returning({
        id: storeCollections.id,
        name: storeCollections.name,
        slug: storeCollections.slug,
        image: storeCollections.image,
        sortOrder: storeCollections.sortOrder,
      });

    return created;
  },

  async updateCollection(collectionId: string, payload: { name?: string; slug?: string; image?: string | null }) {
    const [updated] = await db
      .update(storeCollections)
      .set({
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.slug ? { slug: payload.slug } : {}),
        ...(payload.image !== undefined ? { image: payload.image } : {}),
        updatedAt: new Date(),
      })
      .where(eq(storeCollections.id, collectionId))
      .returning({
        id: storeCollections.id,
        name: storeCollections.name,
        slug: storeCollections.slug,
        image: storeCollections.image,
        sortOrder: storeCollections.sortOrder,
      });

    return updated;
  },

  async deleteCollection(collectionId: string) {
    await db.delete(storeCollections).where(eq(storeCollections.id, collectionId));
  },
};
