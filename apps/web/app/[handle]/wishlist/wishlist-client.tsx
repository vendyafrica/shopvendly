"use client";

import { useWishlistView } from "../hooks/use-wishlist-view";
import { WishlistUI } from "../components/wishlist-ui";

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
