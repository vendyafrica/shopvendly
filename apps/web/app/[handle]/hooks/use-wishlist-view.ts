"use client";

import { useParams, useRouter } from "next/navigation";
import { useWishlist } from "@/hooks/use-wishlist";

export function useWishlistView() {
    const params = useParams();
    const router = useRouter();
    const storeSlug = (params?.handle as string) || (params?.s as string) || "";
    const { items, removeFromWishlist } = useWishlist();

    const storeItems = items.filter((item) => item.store?.slug === storeSlug);

    const handleBack = () => {
        router.push(`/${storeSlug}`);
    };

    return {
        storeSlug,
        storeItems,
        removeFromWishlist,
        handleBack
    };
}
