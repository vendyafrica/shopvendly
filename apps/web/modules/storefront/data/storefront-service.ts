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
} from "@shopvendly/db";

const DEFAULT_STORE_LOGO = "/vendly.png";

async function findStoreBySlugFresh(slug: string) {
  const store = await db.query.stores.findFirst({
    where: and(eq(stores.slug, slug), isNull(stores.deletedAt)),
  });

  if (!store) return undefined;

  return { ...store, logoUrl: store.logoUrl ?? DEFAULT_STORE_LOGO };
}

function slugifyName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function resolveProductSlug(product: { slug: string | null; productName: string }): string {
  return product.slug || slugifyName(product.productName || "");
}

type RatingAggregate = { average: number; count: number };

function toCanonicalUploadThingUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    const fileId = parsed.pathname.split("/").filter(Boolean).pop();
    if (!fileId) return rawUrl;

    const isUploadThingHost = parsed.hostname.endsWith(".ufs.sh") || parsed.hostname === "utfs.io";
    if (!isUploadThingHost) return rawUrl;

    const typeParam =
      parsed.searchParams.get("x-ut-file-type") ||
      parsed.searchParams.get("file-type");

    const canonicalBase = `https://utfs.io/f/${fileId}`;
    if (typeParam) {
      const encodedType = encodeURIComponent(typeParam);
      return `${canonicalBase}?x-ut-file-type=${encodedType}`;
    }

    return canonicalBase;
  } catch {
    return rawUrl;
  }
}

function resolveMediaUrl(entry?: any | null): string | null {
  if (!entry?.media) return null;

  const { blobUrl, blobPathname } = entry.media;

  if (blobPathname) {
    if (/^https?:\/\//i.test(blobPathname)) {
      return toCanonicalUploadThingUrl(blobPathname);
    }
    return `https://utfs.io/f/${blobPathname.replace(/^\/+/, "")}`;
  }

  if (blobUrl) return toCanonicalUploadThingUrl(blobUrl);

  return null;
}

function resolveMediaContentType(entry?: any | null): string | null {
  return entry?.media?.contentType ?? null;
}

function normalizeMediaUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls
    .filter((url): url is string => typeof url === "string" && url.length > 0)
    .map((url) => toCanonicalUploadThingUrl(url));
}

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

function mapToStorefrontProduct(product: any, rating?: RatingAggregate) {
  const price = Number(product.priceAmount || 0);
  const originalPrice = Number(product.originalPriceAmount || 0);
  const hasSale = originalPrice > price && price >= 0;
  const discountPercent = hasSale && originalPrice > 0
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  const variantOptions = product.variants?.enabled
    ? product.variants.options ?? []
    : [];

  const variantSummary = {
    hasColors: variantOptions.some((option: any) => option.type === "color" && (option.values?.length ?? 0) > 0),
    hasSizes: variantOptions.some((option: any) => option.type === "size" && (option.values?.length ?? 0) > 0),
  };

  return {
    id: product.id,
    slug: product.slug || product.productName.toLowerCase().replace(/\s+/g, "-"),
    name: product.productName,
    description: product.description,
    price,
    originalPrice: hasSale ? originalPrice : null,
    hasSale,
    discountPercent,
    currency: product.currency,
    image: resolveMediaUrl(product.media?.[0]),
    contentType: resolveMediaContentType(product.media?.[0]),
    images: (product.media as any[])?.map(resolveMediaUrl).filter(Boolean) as string[],
    mediaItems: (product.media as any[])?.map(m => ({
      url: resolveMediaUrl(m),
      contentType: resolveMediaContentType(m)
    })).filter((m): m is { url: string; contentType: string | null } => !!m.url),
    variants: product.variants ?? null,
    variantSummary,
    averageRating: rating?.average ?? 0,
    ratingCount: rating?.count ?? 0,
    createdAt: product.createdAt,
  };
}

export const storefrontService = {
  async findStoreBySlug(slug: string) {
    const store = await findStoreBySlugFresh(slug);
    if (!store) return undefined;

    const rating = await this.getStoreRatingAggregate(store.id);
    const normalizedLogo = typeof store.logoUrl === "string"
      ? toCanonicalUploadThingUrl(store.logoUrl)
      : undefined;

    const logoUrl = normalizedLogo && !/cdninstagram\.com/i.test(normalizedLogo)
      ? normalizedLogo
      : DEFAULT_STORE_LOGO;

    return {
      ...store,
      logoUrl,
      heroMedia: normalizeMediaUrls(store.heroMedia),
      rating: rating.rating,
      ratingCount: rating.ratingCount,
    };
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

  async getStoreProducts(storeId: string, query?: string) {
    const normalizedQuery = query?.trim().toLowerCase() || "";

    const productsForStore = await db.query.products.findMany({
      where: and(
        eq(products.storeId, storeId),
        eq(products.status, "active"),
        isNull(products.deletedAt),
        gt(products.quantity, 0)
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

    const ratingMap = await getRatingsMap(productsForStore.map((p) => p.id));

    const filtered = normalizedQuery
      ? productsForStore.filter((product) => product.productName?.toLowerCase().includes(normalizedQuery))
      : productsForStore;

    return filtered.map((product) => {
      const rating = ratingMap.get(product.id);
      return mapToStorefrontProduct(product, rating);
    });
  },

  async getStoreProductsWithFilters(storeId: string, options: { q?: string; collection?: string; section?: string }) {
    const { q, collection, section } = options;
    
    const productList = collection
      ? await this.getStoreProductsByCollectionSlug(storeId, collection, q)
      : await this.getStoreProducts(storeId, q);

    let filtered = productList;

    if (section === "sale") {
      filtered = filtered.filter((product) => product.hasSale);
    }

    if (section === "new-arrivals") {
      filtered = [...filtered]
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, 12);
    }

    return filtered;
  },

  async getStoreProductBySlug(storeId: string, productSlug: string) {
    const bySlug = await db.query.products.findFirst({
      where: and(
        eq(products.storeId, storeId),
        eq(products.status, "active"),
        isNull(products.deletedAt),
        eq(products.slug, productSlug),
        gt(products.quantity, 0)
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
      return mapToStorefrontProduct(bySlug, rating);
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

    const match = fallbackProducts.find((product) => resolveProductSlug(product) === productSlug);

    if (!match) return undefined;

    const ratingMap = await getRatingsMap([match.id]);
    const rating = ratingMap.get(match.id);
    return mapToStorefrontProduct(match, rating);
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
          eq(storeCollections.slug, collectionSlug),
          gt(products.quantity, 0)
        )
      );

    const ids = matches.map((match) => match.id);
    if (ids.length === 0) return [];

    const productsForStore = await db.query.products.findMany({
      where: and(
        inArray(products.id, ids),
        eq(products.status, "active"),
        isNull(products.deletedAt),
        gt(products.quantity, 0)
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

    const ratingMap = await getRatingsMap(productsForStore.map((p) => p.id));

    const filtered = normalizedQuery
      ? productsForStore.filter((product) => product.productName?.toLowerCase().includes(normalizedQuery))
      : productsForStore;

        return filtered.map((product) => {
            const rating = ratingMap.get(product.id);
            return mapToStorefrontProduct(product, rating);
        });
    }
};
