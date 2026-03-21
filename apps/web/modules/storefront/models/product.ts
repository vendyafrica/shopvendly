export interface ProductVariantOption {
    type: string;
    label: string;
    values: string[];
    preset?: string | null;
}

export interface ProductVariants {
    enabled: boolean;
    options: ProductVariantOption[];
}

export interface MediaItem {
    url: string;
    contentType?: string | null;
}

export interface StoreSummary {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
}

export interface Product {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    price: number;
    originalPrice?: number | null;
    currency: string;
    images: string[];
    mediaItems?: MediaItem[];
    variants?: ProductVariants | null;
    videos?: string[];
    rating?: number;
    ratingCount?: number;
    userRating?: number | null;
    availableQuantity?: number | null;
    store: StoreSummary;
}
