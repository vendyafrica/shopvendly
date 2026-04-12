export type StoreRouteParams = {
    params: Promise<{ storeId: string }>;
};

export type CartItemRouteParams = {
    params: Promise<{ productId: string }>;
};

export type ProductRatingRouteParams = {
    params: Promise<{ slug: string; productSlug: string }>;
};

export type OrderRouteParams = {
    params: Promise<{ orderId: string }>;
};

export type CollectionRouteParams = {
    params: Promise<{ slug: string }>;
};

export type MarketplaceCategoryRouteParams = {
    params: Promise<{ slug: string }>;
};

export type CollectionItemRouteParams = {
    params: Promise<{ collectionId: string }>;
};
