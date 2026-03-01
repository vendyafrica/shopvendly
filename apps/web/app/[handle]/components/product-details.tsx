"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";

import { StarIcon } from "@hugeicons/core-free-icons";
import { StoreAvatar } from "@/components/store-avatar";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { trackStorefrontEvents } from "../lib/storefront-tracking";
import { ProductActions } from "./product-actions";
import { Bricolage_Grotesque } from "next/font/google";
import { signInWithOneTap } from "@shopvendly/auth/react";
import { useAppSession } from "@/contexts/app-session-context";
import { isLikelyVideoMedia } from "@/utils/misc";

const geistSans = Bricolage_Grotesque({
    variable: "--font-bricolage-grotesque",
    subsets: ["latin"],
});

interface ProductDetailsProps {
    product: {
        id: string;
        slug: string;
        name: string;
        description?: string | null;
        price: number;
        currency: string;
        images: string[];
        mediaItems?: { url: string; contentType?: string | null }[];
        videos?: string[];
        rating?: number;
        ratingCount?: number;
        userRating?: number | null;
        store: {
            id: string;
            name: string;
            slug: string;
            logoUrl?: string | null;
        };
    };
    storeCategories?: string[];
}

export function ProductDetails({ product }: ProductDetailsProps) {

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

    return (
        <div className="min-h-screen bg-white pb-16" suppressHydrationWarning>
            <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[1.8fr_1fr] gap-4 lg:gap-6 xl:gap-8 px-4 sm:px-6 lg:px-10 pt-0 lg:pt-0 -mt-4">
                {/* Left: Gallery */}
                <div className="flex flex-col gap-3 lg:sticky lg:top-0 lg:self-start lg:h-max">
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
                                            className="h-full w-full object-cover"
                                            muted
                                            loop
                                            playsInline
                                            autoPlay
                                        />
                                    ) : (
                                        <Image
                                            src={media.url}
                                            alt={`${product.name} ${index + 1}`}
                                            fill
                                            className="object-cover"
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
                    <div className="hidden lg:flex flex-row gap-6 lg:gap-8 h-[75vh] min-h-[600px] max-h-[900px]">
                        <div className="flex flex-col gap-4 w-20 xl:w-24 shrink-0 overflow-y-auto scrollbar-hide">
                            {mediaItems.map((media, index) => {
                                const isVideo = isVideoUrl(media.url, media.contentType);
                                return (
                                    <button
                                        key={`${media.url}-${index}`}
                                        onClick={() => setSelectedMediaIndex(index)}
                                        onMouseEnter={() => setSelectedMediaIndex(index)}
                                        className={`
                                            relative w-full aspect-3/4 overflow-hidden transition-all duration-300 rounded-none
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
                                                className="h-full w-full object-cover"
                                                muted
                                                loop
                                                playsInline
                                                autoPlay
                                            />
                                        ) : (
                                            <Image
                                                src={media.url}
                                                alt={`View ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                unoptimized={media.url.includes(".ufs.sh")}
                                                onError={() => handleImageError(media.url)}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1 relative bg-neutral-100 overflow-hidden h-full rounded-md">
                            {currentIsVideo ? (
                                <>
                                    <video
                                        src={currentMedia.url}
                                        poster={posterFallback}
                                        className="h-full w-full object-cover"
                                        muted
                                        loop
                                        autoPlay
                                        playsInline
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
                                    className="object-cover object-center"
                                    priority
                                    unoptimized={currentMedia.url.includes(".ufs.sh")}
                                    onError={() => handleImageError(currentMedia.url)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Product Details */}
                <div className="flex flex-col pt-1 lg:pt-0 lg:pl-6 max-w-xl w-full lg:max-w-[520px] xl:max-w-[560px]">

                    {/* Store Info - Header */}
                    <div className="flex items-center justify-between mb-3 mt-0">
                        <Link
                            href={`/${product.store.slug ?? ""}`}
                            className="flex items-center gap-3 group"
                            prefetch
                        >
                            <StoreAvatar
                                storeName={product.store.name}
                                logoUrl={product.store.logoUrl}
                                size="sm"
                            />
                            <div>
                                <p className={` ${geistSans.className} text-base tracking-wide font-medium text-neutral-900 group-hover:underline`}>{product.store.name}</p>
                            </div>
                        </Link>
                    </div>

                    {/* Product Name & Rating */}
                    <div className="mb-6">
                        <h1 className="text-[26px] lg:text-[28px] font-semibold text-neutral-900 leading-snug tracking-tight mb-2">
                            {product.name}
                        </h1>

                        <div className="flex flex-col gap-2 mb-5">
                            <div className="flex items-center gap-1">
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
                                            className="p-1 text-yellow-500 disabled:opacity-50"
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
                                <span className="text-sm font-medium text-neutral-900 ml-2">
                                    {Number.isFinite(averageRating) ? averageRating.toFixed(1) : "0.0"}
                                </span>
                                <span className="text-sm text-neutral-600 ml-1">
                                    ({ratingCount || 0} ratings)
                                </span>
                            </div>
                            {userRating ? (
                                <span className="text-xs text-neutral-600">You rated this {userRating}★</span>
                            ) : (
                                <span className="text-xs text-neutral-500">Tap to rate</span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-neutral-900">
                                {product.currency} {product.price.toLocaleString(undefined, {
                                    minimumFractionDigits: product.currency === "USD" ? 2 : 0,
                                    maximumFractionDigits: product.currency === "USD" ? 2 : 0,
                                })}
                            </span>
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="mb-8 w-full max-w-[460px]">
                        <ProductActions product={product} />
                    </div>

                    {product.description && (
                        <div className="border-t border-neutral-100 pt-5">
                            <h2 className="text-sm font-medium mb-3 uppercase tracking-widest text-neutral-900">Description / Details</h2>
                            <div className="text-sm leading-relaxed text-neutral-600">
                                <p>{product.description}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
