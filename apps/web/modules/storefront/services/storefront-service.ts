import { DEFAULT_STORE_LOGO } from "@/shared/lib/constants/defaults";
import {
  normalizeMediaUrls,
  resolveMediaContentType,
  resolveMediaUrl,
  toCanonicalUploadThingUrl,
  type MediaEntry,
} from "@/modules/media/services";
import { storefrontRepo } from "@/modules/storefront/services/storefront-queries";
import type { ProductVariantOption } from "@/modules/storefront/models/product";

type RatingAggregate = { average: number; count: number };

type StorefrontProductRecord = {
  id: string;
  slug: string | null;
  productName: string;
  description?: string | null;
  priceAmount?: number | null;
  originalPriceAmount?: number | null;
  currency: string;
  quantity?: number | null;
  createdAt?: Date | string | null;
  variants?: {
    enabled?: boolean;
    options?: ProductVariantOption[];
  } | null;
  media?: MediaEntry[] | null;
};

function slugifyName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function resolveProductSlug(product: { slug: string | null; productName: string }) {
  return product.slug || slugifyName(product.productName || "");
}

function mapToStorefrontProduct(product: StorefrontProductRecord, rating?: RatingAggregate) {
  const price = Number(product.priceAmount || 0);
  const originalPrice = Number(product.originalPriceAmount || 0);
  const hasSale = originalPrice > price && price >= 0;
  const discountPercent = hasSale && originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : null;

  const variantOptions: ProductVariantOption[] = product.variants?.enabled ? product.variants.options ?? [] : [];
  const variantSummary = {
    hasColors: variantOptions.some((option) => option.type === "color" && (option.values?.length ?? 0) > 0),
    hasSizes: variantOptions.some((option) => option.type === "size" && (option.values?.length ?? 0) > 0),
  };

  const mediaEntries: MediaEntry[] = Array.isArray(product.media) ? (product.media as MediaEntry[]) : [];

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
    image: resolveMediaUrl(mediaEntries[0]),
    contentType: resolveMediaContentType(mediaEntries[0]),
    images: mediaEntries.map(resolveMediaUrl).filter((url): url is string => Boolean(url)),
    mediaItems: mediaEntries.map((m) => ({
      url: resolveMediaUrl(m),
      contentType: resolveMediaContentType(m),
    })).filter((m): m is { url: string; contentType: string | null } => Boolean(m.url)),
    variants: (product.variants as import("../models/product").ProductVariants | null | undefined) ?? null,
    variantSummary,
    averageRating: rating?.average ?? 0,
    ratingCount: rating?.count ?? 0,
    createdAt: product.createdAt,
  };
}

export const storefrontService = {
  async findStoreBySlug(slug: string) {
    const store = await storefrontRepo.findStoreBySlug(slug);
    if (!store) return undefined;

    const rating = await storefrontRepo.getStoreRatingAggregate(store.id);
    const normalizedLogo = typeof store.logoUrl === "string" ? toCanonicalUploadThingUrl(store.logoUrl) : undefined;
    const logoUrl = normalizedLogo && !/cdninstagram\.com/i.test(normalizedLogo) ? normalizedLogo : DEFAULT_STORE_LOGO;

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
    const collections = await storefrontRepo.listStoreCollections(storeId);

    if (!normalizedQuery) return collections;
    return collections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(normalizedQuery) ||
        collection.slug.toLowerCase().includes(normalizedQuery),
    );
  },

  async getStoreProducts(storeId: string, query?: string) {
    const normalizedQuery = query?.trim().toLowerCase() || "";
    const productsForStore = await storefrontRepo.listActiveProductsForStore(storeId);
    const ratingMap = await storefrontRepo.getRatingsMap(productsForStore.map((p) => p.id));

    const filtered = normalizedQuery
      ? productsForStore.filter((product) => product.productName?.toLowerCase().includes(normalizedQuery))
      : productsForStore;

    return filtered.map((product) => mapToStorefrontProduct(product, ratingMap.get(product.id)));
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
    const bySlug = await storefrontRepo.findActiveProductBySlug(storeId, productSlug);
    if (bySlug) {
      const ratingMap = await storefrontRepo.getRatingsMap([bySlug.id]);
      return mapToStorefrontProduct(bySlug, ratingMap.get(bySlug.id));
    }

    const fallbackProducts = await storefrontRepo.listFallbackActiveProducts(storeId);
    const match = fallbackProducts.find((product) => resolveProductSlug(product) === productSlug);
    if (!match) return undefined;

    const ratingMap = await storefrontRepo.getRatingsMap([match.id]);
    return mapToStorefrontProduct(match, ratingMap.get(match.id));
  },

  async getStoreRatingAggregate(storeId: string) {
    return storefrontRepo.getStoreRatingAggregate(storeId);
  },

  async getStoreProductsByCategorySlug(storeId: string, categorySlug: string, query?: string) {
    return this.getStoreProductsByCollectionSlug(storeId, categorySlug, query);
  },

  async getStoreProductsByCollectionSlug(storeId: string, collectionSlug: string, query?: string) {
    const normalizedQuery = query?.trim().toLowerCase() || "";
    const ids = await storefrontRepo.findProductIdsByCollectionSlug(storeId, collectionSlug);
    if (ids.length === 0) return [];

    const productsForStore = await storefrontRepo.listActiveProductsByIds(ids);
    const ratingMap = await storefrontRepo.getRatingsMap(productsForStore.map((p) => p.id));

    const filtered = normalizedQuery
      ? productsForStore.filter((product) => product.productName?.toLowerCase().includes(normalizedQuery))
      : productsForStore;

    return filtered.map((product) => mapToStorefrontProduct(product, ratingMap.get(product.id)));
  },
};
