import { 
  db, 
  products, 
  productMedia, 
  mediaObjects, 
  storeCollections, 
  productCollections, 
  orderItems, 
  orders,
  eq, 
  and, 
  isNull, 
  desc, 
  sql, 
  like, 
  inArray 
} from "@shopvendly/db";

export const productRepo = {
  async findByStoreSlug(_storeSlug: string) {
    void _storeSlug;

    return db.query.products.findMany({
      where: (products, { eq, and }) =>
        and(
          eq(products.status, "active"),
        ),
      with: {
        store: true,
        media: {
          with: {
            media: true,
          },
          orderBy: (media, { desc }) => [desc(media.isFeatured)],
        },
      },
    });
  },

  async findByStoreId(storeId: string) {
    return db.query.products.findMany({
      where: and(eq(products.storeId, storeId), eq(products.status, "active")),
      columns: {
        id: true,
        slug: true,
        productName: true,
        description: true,
        priceAmount: true,
        currency: true,
      },
      with: {
        media: {
          with: {
            media: {
              columns: {
                blobUrl: true,
                contentType: true,
              },
            },
          },
          orderBy: (media, { desc }) => [desc(media.isFeatured)],
          limit: 1,
        },
      },
    });
  },

  async findById(id: string) {
    return db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        media: {
          with: {
            media: true,
          },
          orderBy: (media, { desc }) => [desc(media.isFeatured)],
        },
        store: true,
      },
    });
  },

  async findWithMedia(id: string, tenantId: string) {
    return db.query.products.findFirst({
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
  },

  async findScopeById(id: string) {
    return db.query.products.findFirst({
      where: and(eq(products.id, id), isNull(products.deletedAt)),
      columns: {
        id: true,
        storeId: true,
        tenantId: true,
        slug: true
      },
    });
  },

  async create(data: typeof products.$inferInsert) {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  },

  async update(id: string, tenantId: string, data: Partial<typeof products.$inferInsert>) {
    const [updated] = await db.update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(products.id, id),
        eq(products.tenantId, tenantId),
        isNull(products.deletedAt)
      ))
      .returning();
    return updated;
  },

  async delete(id: string, tenantId: string) {
    const [deleted] = await db.update(products)
      .set({ deletedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
      .returning();
    return deleted;
  },

  async list(tenantId: string, filters: { 
    storeId?: string; 
    source?: string; 
    page: number; 
    limit: number; 
    search?: string; 
  }) {
    const { storeId, source, page, limit, search } = filters;
    const offset = (page - 1) * limit;

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

    return {
      products: productList,
      total: count,
    };
  },

  async getSalesMap(tenantId: string, productIds: string[]) {
    if (productIds.length === 0) return new Map<string, number>();

    const salesRows = await db
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
          isNull(orders.deletedAt),
          inArray(orderItems.productId, productIds)
        )
      )
      .groupBy(orderItems.productId);

    const salesMap = new Map<string, number>();
    salesRows.forEach((row) => {
      if (row.productId) salesMap.set(row.productId, row.salesAmount || 0);
    });
    return salesMap;
  },

  async syncCollections(productId: string, tenantId: string, storeId: string, collectionIds: string[]) {
    await db.delete(productCollections).where(eq(productCollections.productId, productId));

    const normalizedIds = Array.from(new Set(collectionIds.filter(Boolean)));
    if (normalizedIds.length === 0) return [];

    const validCollections = await db.query.storeCollections.findMany({
      where: and(
        eq(storeCollections.tenantId, tenantId),
        eq(storeCollections.storeId, storeId),
        inArray(storeCollections.id, normalizedIds)
      ),
      columns: { id: true },
    });

    if (validCollections.length === 0) return [];

    await db.insert(productCollections).values(
      validCollections.map((collection) => ({
        collectionId: collection.id,
        productId,
      }))
    );

    return validCollections.map((collection) => collection.id);
  },

  async getCollectionIds(productId: string) {
    const collectionLinks = await db.query.productCollections.findMany({
      where: eq(productCollections.productId, productId),
      columns: { collectionId: true },
    });
    return collectionLinks.map((link) => link.collectionId);
  },
};
