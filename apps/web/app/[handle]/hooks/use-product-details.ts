"use client";

import { useState, useEffect, useMemo } from "react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { trackStorefrontEvents } from "../lib/storefront-tracking";
import { signInWithOneTap } from "@shopvendly/auth/react";
import { useAppSession } from "@/contexts/app-session-context";
import { isLikelyVideoMedia } from "@/utils/misc";
import { Product } from "../models/product";

interface UseProductDetailsProps {
    product: Product;
}

export function useProductDetails({ product }: UseProductDetailsProps) {
    const { addToRecentlyViewed } = useRecentlyViewed();
    const { session } = useAppSession();

    useEffect(() => {
        if (!product?.store?.slug || !product?.id) return;
        void trackStorefrontEvents(
            product.store.slug,
            [
                {
                    eventType: "product_view",
                    productId: product.id,
                    meta: { productSlug: product.slug },
                },
            ],
            { userId: session?.user?.id }
        );
    }, [product, session?.user?.id]);

    useEffect(() => {
        if (product) {
            addToRecentlyViewed({
                id: product.id,
                name: product.name,
                price: product.price,
                currency: product.currency,
                image: product.images[0] || "",
                contentType: product.mediaItems?.[0]?.contentType || undefined,
                store: {
                    name: product.store.name,
                    slug: product.store.slug,
                },
                slug: product.slug,
            });
        }
    }, [product, addToRecentlyViewed]);

    // Selection state
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const variantOptions = product.variants?.enabled ? product.variants.options ?? [] : [];
    const colorOption = variantOptions.find((option: any) => option.type === "color");
    const sizeOption = variantOptions.find((option: any) => option.type === "size");
    
    const [selectedColor, setSelectedColor] = useState<string | null>(colorOption?.values?.[0] ?? null);
    const [selectedSize, setSelectedSize] = useState<string | null>(sizeOption?.values?.[0] ?? null);

    useEffect(() => {
        setSelectedColor(colorOption?.values?.[0] ?? null);
        setSelectedSize(sizeOption?.values?.[0] ?? null);
    }, [colorOption, sizeOption]);

    // Rating state
    const initialRating = typeof product.rating === "number" && Number.isFinite(product.rating) ? product.rating : 0;
    const [averageRating, setAverageRating] = useState(initialRating);
    const [ratingCount, setRatingCount] = useState(product.ratingCount ?? 0);
    const [userRating, setUserRating] = useState<number | null>(product.userRating ?? null);
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    useEffect(() => {
        setAverageRating(initialRating);
        setRatingCount(product.ratingCount ?? 0);
        setUserRating(product.userRating ?? null);
    }, [initialRating, product.ratingCount, product.userRating]);

    const handleSubmitRating = async (value: number) => {
        if (isSubmittingRating) return;

        if (!session?.user?.id) {
            try {
                await signInWithOneTap({ callbackURL: window.location.href });
            } catch (err) {
                console.error("One Tap failed", err);
            }
            return;
        }

        const prevAverage = averageRating;
        const prevCount = ratingCount;
        const prevUserRating = userRating;

        // Optimistic update
        let nextAverage = averageRating;
        let nextCount = ratingCount;
        if (userRating == null) {
            nextCount = ratingCount + 1;
            nextAverage = ((averageRating * ratingCount) + value) / nextCount;
        } else {
            nextAverage = ((averageRating * ratingCount) - userRating + value) / ratingCount;
        }

        setAverageRating(nextAverage);
        setRatingCount(nextCount);
        setUserRating(value);
        setIsSubmittingRating(true);
        try {
            const res = await fetch(`/api/storefront/${product.store.slug}/products/${product.slug}/rating`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating: value }),
            });

            if (!res.ok) {
                console.error("Failed to submit rating", await res.text());
                setAverageRating(prevAverage);
                setRatingCount(prevCount);
                setUserRating(prevUserRating ?? null);
                return;
            }

            const data = await res.json();
            setAverageRating(typeof data.rating === "number" ? data.rating : value);
            setRatingCount(typeof data.ratingCount === "number" ? data.ratingCount : ratingCount);
            setUserRating(value);
        } catch (error) {
            console.error("Error submitting rating", error);
            setAverageRating(prevAverage);
            setRatingCount(prevCount);
            setUserRating(prevUserRating ?? null);
        } finally {
            setIsSubmittingRating(false);
        }
    };

    // Media and utilities
    const [failedImageUrls, setFailedImageUrls] = useState<Record<string, true>>({});
    const FALLBACK_PRODUCT_IMAGE = "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg";

    const handleImageError = (url: string) => {
        setFailedImageUrls((prev) => (prev[url] ? prev : { ...prev, [url]: true }));
    };

    const isVideoUrl = (url: string, contentType?: string | null) => {
        if (failedImageUrls[url]) return true;
        return isLikelyVideoMedia({ url, contentType });
    };

    const mediaItems = useMemo(() => {
        const items = (product.mediaItems?.length
            ? product.mediaItems
            : product.images?.map((url: string) => ({ url, contentType: null }))
        )?.filter((m) => !!m?.url) ?? [];

        if (items.length === 0) return [{ url: FALLBACK_PRODUCT_IMAGE, contentType: "image/jpeg" }];

        const seen = new Set<string>();
        return items.filter((m) => {
            const key = m.url;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [product.mediaItems, product.images]);

    const safeSelectedIndex = Math.min(selectedMediaIndex, mediaItems.length - 1);
    const selectedOptions = [
        ...(selectedSize ? [{ name: "Size", value: selectedSize }] : []),
        ...(selectedColor ? [{ name: "Color", value: selectedColor }] : []),
    ];

    return {
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
    };
}
