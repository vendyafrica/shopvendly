"use client";

import { useProductDetails } from "../hooks/use-product-details";
import { ProductDetailsUI } from "./product-details-ui";

interface ProductDetailsProps {
    product: any;
    storeCategories?: string[];
    storePolicy?: string | null;
}

export function ProductDetails({ product, storePolicy }: ProductDetailsProps) {
    const {
        selectedMediaIndex,
        setSelectedMediaIndex,
        selectedColor,
        setSelectedColor,
        selectedSize,
        setSelectedSize,
        averageRating,
        ratingCount,
        userRating,
        isSubmittingRating,
        hoverRating,
        setHoverRating,
        handleSubmitRating,
        mediaItems,
        handleImageError,
        isVideoUrl,
        safeSelectedIndex,
        selectedOptions,
        FALLBACK_PRODUCT_IMAGE
    } = useProductDetails({ product });

    return (
        <ProductDetailsUI
            product={product}
            storePolicy={storePolicy}
            state={{
                selectedMediaIndex,
                selectedColor,
                selectedSize,
                averageRating,
                ratingCount,
                userRating,
                isSubmittingRating,
                hoverRating,
                mediaItems,
                safeSelectedIndex,
                selectedOptions,
                FALLBACK_PRODUCT_IMAGE
            }}
            actions={{
                setSelectedMediaIndex,
                setSelectedColor,
                setSelectedSize,
                setHoverRating,
                handleSubmitRating,
                handleImageError,
                isVideoUrl
            }}
        />
    );
}
