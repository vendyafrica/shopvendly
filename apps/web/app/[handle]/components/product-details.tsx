"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";

import { StarIcon } from "@hugeicons/core-free-icons";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { trackStorefrontEvents } from "../lib/storefront-tracking";
import { ProductActions } from "./product-actions";
import { signInWithOneTap } from "@shopvendly/auth/react";
import { useAppSession } from "@/contexts/app-session-context";
import { isLikelyVideoMedia } from "@/utils/misc";

interface ProductDetailsProps {
    product: {
        id: string;
        slug: string;
        name: string;
        description?: string | null;
        price: number;
        originalPrice?: number | null;
        currency: string;
        images: string[];
        mediaItems?: { url: string; contentType?: string | null }[];
        variants?: {
            enabled?: boolean;
            options?: Array<{
                type?: string;
                label?: string;
                values?: string[];
                preset?: string | null;
            }>;
        } | null;
        videos?: string[];
        rating?: number;
        ratingCount?: number;
        userRating?: number | null;
        availableQuantity?: number | null;
        store: {
            id: string;
            name: string;
            slug: string;
            logoUrl?: string | null;
        };
    };
    storeCategories?: string[];
    storePolicy?: string | null;
}

export function ProductDetails({ product, storePolicy }: ProductDetailsProps) {

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

    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const variantOptions = product.variants?.enabled ? product.variants.options ?? [] : [];
    const colorOption = variantOptions.find((option) => option.type === "color");
    const sizeOption = variantOptions.find((option) => option.type === "size");
    const [selectedColor, setSelectedColor] = useState<string | null>(colorOption?.values?.[0] ?? null);
    const [selectedSize, setSelectedSize] = useState<string | null>(sizeOption?.values?.[0] ?? null);

    const initialRating = typeof product.rating === "number" && Number.isFinite(product.rating)
        ? product.rating
        : 0;

    const [averageRating, setAverageRating] = useState(initialRating);
    const [ratingCount, setRatingCount] = useState(product.ratingCount ?? 0);
    const [userRating, setUserRating] = useState<number | null>(product.userRating ?? null);
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [failedImageUrls, setFailedImageUrls] = useState<Record<string, true>>({});

    useEffect(() => {
        setAverageRating(initialRating);
        setRatingCount(product.ratingCount ?? 0);
        setUserRating(product.userRating ?? null);
    }, [initialRating, product.ratingCount, product.userRating]);

    useEffect(() => {
        setSelectedColor(colorOption?.values?.[0] ?? null);
        setSelectedSize(sizeOption?.values?.[0] ?? null);
    }, [colorOption, sizeOption]);

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
            : product.images?.map((url) => ({ url, contentType: null }))
        )?.filter((m) => !!m?.url) ?? [];

        if (items.length === 0) return [{ url: FALLBACK_PRODUCT_IMAGE, contentType: "image/jpeg" }];

        // Deduplicate by url to avoid repeats
        const seen = new Set<string>();
        return items.filter((m) => {
            const key = m.url;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [product.mediaItems, product.images]);

    const safeSelectedIndex = Math.min(selectedMediaIndex, mediaItems.length - 1);
    const currentMedia = mediaItems[safeSelectedIndex] ?? mediaItems[0] ?? { url: FALLBACK_PRODUCT_IMAGE, contentType: "image/jpeg" };
    const posterFallback = product.images?.find((img) => !isVideoUrl(img)) || FALLBACK_PRODUCT_IMAGE;
    const currentIsVideo = isVideoUrl(currentMedia.url, currentMedia.contentType);
    const hasSale = typeof product.originalPrice === "number" && product.originalPrice > product.price;
    const discountPercent = hasSale && product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null;

    const formatPrice = (amount: number) => {
        const showDecimals = product.currency === "USD";
        return `${product.currency} ${amount.toLocaleString(undefined, {
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0,
        })}`;
    };

    const colorValues = colorOption?.values?.filter(Boolean) ?? [];
    const sizeValues = sizeOption?.values?.filter(Boolean) ?? [];
    const hasColorOptions = colorValues.length > 0;
    const hasSizeOptions = sizeValues.length > 0;
    const selectedOptions = [
        ...(selectedSize ? [{ name: "Size", value: selectedSize }] : []),
        ...(selectedColor ? [{ name: "Color", value: selectedColor }] : []),
    ];

    return (
        <div className="min-h-screen bg-white pb-16" suppressHydrationWarning>
            <div className="max-w-[1520px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)] gap-6 lg:gap-10 xl:gap-14 px-4 sm:px-6 lg:px-12 pt-0 lg:pt-0 -mt-4">
                {/* Left: Gallery */}
                <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start lg:h-max">
                    {/* Mobile carousel */}
                    <div className="lg:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
                        {mediaItems.map((media, index) => {
                            const isVideo = isVideoUrl(media.url, media.contentType);
                            return (
                                <div
                                    key={`${media.url}-${index}`}
                                    className="relative w-[85vw] sm:w-[70vw] shrink-0 snap-center rounded-none md:rounded-md overflow-hidden bg-neutral-100 aspect-3/4 min-h-[320px]"
                                    style={{ aspectRatio: "3 / 4" }}
                                >
                                    {isVideo ? (
                                        <video
                                            src={media.url}
                                            poster={posterFallback}
                                            className="h-full w-full object-cover bg-neutral-100"
                                            muted
                                            loop
                                            playsInline
                                            autoPlay
                                            preload="none"
                                        />
                                    ) : (
                                        <Image
                                            src={media.url}
                                            alt={`${product.name} ${index + 1}`}
                                            fill
                                            className="object-cover bg-neutral-100"
                                            priority={index === 0}
                                            unoptimized={media.url.includes(".ufs.sh")}
                                            onError={() => handleImageError(media.url)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop thumbs + main */}
                    <div className="hidden lg:flex flex-row gap-6 lg:gap-8 h-[78vh] min-h-[620px] max-h-[920px]">
                        <div className="flex flex-col gap-4 w-20 xl:w-24 shrink-0 overflow-y-auto scrollbar-hide">
                            {mediaItems.map((media, index) => {
                                const isVideo = isVideoUrl(media.url, media.contentType);
                                return (
                                    <button
                                        key={`${media.url}-${index}`}
                                        onClick={() => setSelectedMediaIndex(index)}
                                        onMouseEnter={() => setSelectedMediaIndex(index)}
                                        className={`
                                            relative w-full aspect-3/4 overflow-hidden transition-all duration-300 rounded-2xl
                                            ${safeSelectedIndex === index
                                                ? "ring-1 ring-black opacity-100"
                                                : "opacity-60 hover:opacity-100"
                                            }
                                        `}
                                    >
                                        {isVideo ? (
                                            <video
                                                src={media.url}
                                                poster={posterFallback}
                                                className="h-full w-full object-cover bg-neutral-100"
                                                muted
                                                loop
                                                playsInline
                                                autoPlay
                                                preload="none"
                                            />
                                        ) : (
                                            <Image
                                                src={media.url}
                                                alt={`View ${index + 1}`}
                                                fill
                                                className="object-cover bg-neutral-100"
                                                unoptimized={media.url.includes(".ufs.sh")}
                                                onError={() => handleImageError(media.url)}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1 relative bg-neutral-100 overflow-hidden h-full rounded-3xl">
                            {currentIsVideo ? (
                                <>
                                    <video
                                        src={currentMedia.url}
                                        poster={posterFallback}
                                        className="h-full w-full object-cover bg-neutral-100"
                                        muted
                                        loop
                                        autoPlay
                                        playsInline
                                        preload="none"
                                    />
                                    {/* <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/70 text-white text-xs px-2 py-1">
                                        <span aria-hidden>▶</span>
                                        <span>Playing</span>
                                    </div> */}
                                </>
                            ) : (
                                <Image
                                    src={currentMedia.url}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 60vw"
                                    className="object-cover object-center bg-neutral-100"
                                    priority
                                    unoptimized={currentMedia.url.includes(".ufs.sh")}
                                    onError={() => handleImageError(currentMedia.url)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Product Details */}
                <div className="flex w-full flex-col pt-2 lg:max-w-[520px] lg:justify-self-end lg:pt-2 xl:max-w-[560px]">

                    <div className="space-y-3 border-b border-neutral-100 pb-5 sm:space-y-3.5 sm:pb-6">
                        <h1 className="max-w-[18ch] text-[1.95rem] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-[2.5rem] sm:leading-[1.08]">{product.name}</h1>
                        <div className="flex flex-wrap items-end gap-2 sm:gap-2.5">
                            <span className="text-[1.45rem] font-medium leading-none text-neutral-800 sm:text-[1.7rem]">{formatPrice(product.price)}</span>
                            {hasSale ? (
                                <>
                                    <span className="pb-0.5 text-sm text-neutral-400 line-through">{formatPrice(product.originalPrice as number)}</span>
                                    {discountPercent ? (
                                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-red-600">
                                            {discountPercent}% off
                                        </span>
                                    ) : null}
                                </>
                            ) : null}
                        </div>
                    </div>

                    {hasSizeOptions ? (
                        <div className="mt-6 space-y-2.5 pb-1">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold text-neutral-950">Size</span>
                                {selectedSize ? <span className="text-neutral-500">{selectedSize}</span> : null}
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {sizeValues.map((value) => {
                                    const isActive = selectedSize === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setSelectedSize(value)}
                                            className={`min-w-[88px] rounded-full border px-5 py-3 text-[15px] font-medium transition-colors ${isActive ? "border-neutral-950 bg-white text-neutral-950 shadow-[inset_0_0_0_1px_rgba(10,10,10,0.08)]" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"}`}
                                        >
                                            {value}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    {hasColorOptions ? (
                        <div className="mt-6 space-y-2.5 border-b border-neutral-100 pb-6">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold text-neutral-950">Color</span>
                                {selectedColor ? <span className="text-sm text-neutral-700">{selectedColor}</span> : null}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {colorValues.map((value) => {
                                    const isActive = selectedColor === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setSelectedColor(value)}
                                            className={`rounded-full border px-4 py-2.5 text-[15px] font-medium transition-colors ${isActive ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"}`}
                                        >
                                            {value}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    <div className={`mt-6 ${hasColorOptions || hasSizeOptions ? "" : "border-t border-neutral-100 pt-6"}`}>
                        <div className="mb-5 border-b border-neutral-100 pb-4">
                            <div className="mb-2 flex flex-col gap-2">
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                    {Array.from({ length: 5 }).map((_, idx) => {
                                        const activeValue = hoverRating ?? userRating ?? Math.round(averageRating);
                                        const filled = activeValue >= idx + 1;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSubmitRating(idx + 1)}
                                                onMouseEnter={() => setHoverRating(idx + 1)}
                                                onMouseLeave={() => setHoverRating(null)}
                                                disabled={isSubmittingRating}
                                                className="rounded-full p-1 text-yellow-500 transition-transform duration-150 hover:-translate-y-0.5 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200 disabled:opacity-50"
                                                aria-label={`Rate ${idx + 1} stars`}
                                            >
                                                <HugeiconsIcon
                                                    icon={StarIcon}
                                                    size={18}
                                                    className={filled ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"}
                                                />
                                            </button>
                                        );
                                    })}
                                    <span className="ml-2 text-sm font-semibold text-neutral-900 sm:text-base">
                                        {Number.isFinite(averageRating) ? averageRating.toFixed(1) : "0.0"}
                                    </span>
                                </div>
                                {userRating ? (
                                    <span className="text-sm text-neutral-600">You rated this {userRating}★</span>
                                ) : (
                                    <span className="text-sm text-neutral-400">Tap a star to rate this product</span>
                                )}
                            </div>
                        </div>

                        <div className="mb-6 w-full">
                            <ProductActions product={product} selectedOptions={selectedOptions} />
                        </div>

                        {product.description && (
                            <div className="border-t border-neutral-100 pt-5">
                                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">Description</h2>
                                <div className="text-[15px] leading-7 text-neutral-600">
                                    <p className="capitalize">{product.description}</p>
                                </div>
                            </div>
                        )}

                        {storePolicy ? (
                            <div className="border-t border-neutral-100 pt-5">
                                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">Store Policy</h2>
                                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[14px] leading-6 text-neutral-700 whitespace-pre-wrap">
                                    {storePolicy}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
