import { Product } from "./product";

export interface StoreCollection {
    id: string;
    name: string;
    slug: string;
    image?: string | null;
}

export interface StorefrontProduct extends Pick<Product, 'id' | 'slug' | 'name' | 'price' | 'originalPrice' | 'currency'> {
    image: string | null;
    contentType?: string | null;
    averageRating?: number | null;
    hasSale?: boolean;
}

export interface StoreDetails {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    policy?: string | null;
    storePolicy?: string | null;
    collectoPassTransactionFeeToCustomer?: boolean;
    collectoPayoutMode?: string | null;
    heroMedia?: string[] | null;
    rating?: number;
    ratingCount?: number;
    categories?: string[] | null;
    storeAddress?: string | null;
    status?: boolean;
}
