export interface MarketplaceStore {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl?: string | null;
    instagramAvatarUrl?: string | null;
    images?: string[];
    heroMedia?: string[];
    mediaItems?: { url: string; contentType: string | null }[];
    categories: string[];
}
