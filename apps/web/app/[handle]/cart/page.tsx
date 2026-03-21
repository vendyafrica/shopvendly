"use client";

import { useStoreCart } from "@/modules/storefront/hooks/use-store-cart";
import { StoreCartUI } from "@/modules/storefront/components";

export default function StoreCartPage() {
    const {
        storeSlug,
        storeId,
        storeItems,
        storeSubtotal,
        currency,
        isLoaded,
        handleBack,
        updateQuantity,
        removeItem,
        FALLBACK_PRODUCT_IMAGE
    } = useStoreCart();

    return (
        <StoreCartUI
            storeSlug={storeSlug}
            storeId={storeId}
            storeItems={storeItems}
            storeSubtotal={storeSubtotal}
            currency={currency}
            isLoaded={isLoaded}
            handleBack={handleBack}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            FALLBACK_PRODUCT_IMAGE={FALLBACK_PRODUCT_IMAGE}
        />
    );
}
