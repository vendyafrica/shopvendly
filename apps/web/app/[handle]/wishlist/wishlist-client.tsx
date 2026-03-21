"use client";

import { useWishlistView } from "@/modules/storefront/hooks/use-wishlist-view";
import { WishlistUI } from "@/modules/storefront/components";

export default function WishlistClient() {
    const { storeSlug, storeItems, removeFromWishlist, handleBack } = useWishlistView();

    return (
        <WishlistUI
            storeSlug={storeSlug}
            storeItems={storeItems}
            removeFromWishlist={removeFromWishlist}
            handleBack={handleBack}
        />
    );
}
