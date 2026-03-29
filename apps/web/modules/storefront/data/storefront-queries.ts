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
  inArray,
  sql,
  asc,
  gt,
} from "@/data";

async function findStoreBySlug(slug: string) {
  return db.query.stores.findFirst({
    where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
  });
}

async function listStoreCollections(storeId: string) {
  return db.query.storeCollections.findMany({
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
}

async function listActiveProductsForStore(storeId: string) {
  return db.query.products.findMany({
    where: and(
      eq(products.storeId, storeId),
      eq(products.status, "active"),
      isNull(products.deletedAt),
      gt(products.quantity, 0),
    ),
    columns: {
      id: true,
      slug: true,
      productName: true,
      description: true,
      priceAmount: true,
      originalPriceAmount: true,
      currency: true,
      quantity: true,
      createdAt: true,
      variants: true,
    },
    with: {
      media: {
        with: { media: true },
        orderBy: (media, { asc }) => [asc(media.sortOrder)],
        limit: 1,
      },
    },
  });
}

async function listActiveProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];

  return db.query.products.findMany({
    where: and(
      inArray(products.id, ids),
      eq(products.status, "active"),
      isNull(products.deletedAt),
      gt(products.quantity, 0),
    ),
    columns: {
      id: true,
      slug: true,
      productName: true,
      description: true,
      priceAmount: true,
      originalPriceAmount: true,
      currency: true,
      quantity: true,
      createdAt: true,
      variants: true,
    },
    with: {
      media: {
        with: { media: true },
        orderBy: (media, { asc }) => [asc(media.sortOrder)],
        limit: 1,
      },
    },
  });
}

async function findActiveProductBySlug(storeId: string, productSlug: string) {
  return db.query.products.findFirst({
    where: and(
      eq(products.storeId, storeId),
      eq(products.status, "active"),
      isNull(products.deletedAt),
      eq(products.slug, productSlug),
      gt(products.quantity, 0),
    ),
    with: {
      media: {
        with: { media: true },
        orderBy: (media, { asc }) => [asc(media.sortOrder)],
      },
    },
  });
}

async function listFallbackActiveProducts(storeId: string) {
  return db.query.products.findMany({
    where: and(
      eq(products.storeId, storeId),
      eq(products.status, "active"),
      isNull(products.deletedAt),
    ),
    columns: {
      id: true,
      slug: true,
      productName: true,
      description: true,
      priceAmount: true,
      originalPriceAmount: true,
      currency: true,
      quantity: true,
      createdAt: true,
      variants: true,
    },
    with: {
      media: {
        with: { media: true },
        orderBy: (media, { asc }) => [asc(media.sortOrder)],
      },
    },
  });
}

async function getRatingsMap(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, { average: number; count: number }>();

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

async function getStoreRatingAggregate(storeId: string) {
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
}

async function findProductIdsByCollectionSlug(storeId: string, collectionSlug: string) {
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
        eq(storeCollections.slug, collectionSlug),
        gt(products.quantity, 0),
      ),
    );

  return matches.map((match) => match.id);
}

export const storefrontRepo = {
  findStoreBySlug,
  listStoreCollections,
  listActiveProductsForStore,
  listActiveProductsByIds,
  findActiveProductBySlug,
  listFallbackActiveProducts,
  getRatingsMap,
  getStoreRatingAggregate,
  findProductIdsByCollectionSlug,
};
