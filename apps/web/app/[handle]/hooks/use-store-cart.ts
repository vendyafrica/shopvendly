"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/modules/cart/context/cart-context";
import { CartItem } from "../models/cart";

export function useStoreCart() {
    const params = useParams();
    const router = useRouter();
    const storeSlug = (params?.handle as string) || (params?.s as string);
    const { itemsByStore, updateQuantity, removeItem, isLoaded } = useCart();

    const storeId = useMemo(() => {
        if (!isLoaded) return null;

        for (const [id, items] of Object.entries(itemsByStore)) {
            if (items[0]?.store?.slug === storeSlug) {
                return id;
            }
        }

        return null;
    }, [isLoaded, itemsByStore, storeSlug]);

    const handleBack = () => {
        router.push(`/${storeSlug || ""}`);
    };

    const storeItems = storeId ? (itemsByStore[storeId] || []) : [] as CartItem[];
    const storeSubtotal = storeItems.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0);
    const currency = storeItems[0]?.product.currency || "UGX";

    const FALLBACK_PRODUCT_IMAGE = "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg";

    return {
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
    };
}
