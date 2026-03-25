"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { ProductActions } from "./product-actions";
import { Product, MediaItem } from "@/modules/storefront/models/product";
import { cn } from "@shopvendly/ui/lib/utils";
import { getColorName } from "@/lib/constants/colors";
import * as React from "react";

interface ProductDetailsUIProps {
    product: Product;
    storePolicy?: string | null;
    state: {
        selectedMediaIndex: number;
        selectedColor: string | null;
        selectedSize: string | null;
        averageRating: number;
        ratingCount: number;
        userRating: number | null;
        isSubmittingRating: boolean;
        hoverRating: number | null;
        mediaItems: MediaItem[];
        safeSelectedIndex: number;
        selectedOptions: any[];
        FALLBACK_PRODUCT_IMAGE: string;
    };
    actions: {
        setSelectedMediaIndex: (index: number) => void;
        setSelectedColor: (color: string) => void;
        setSelectedSize: (size: string) => void;
        setHoverRating: (rating: number | null) => void;
        handleSubmitRating: (rating: number) => void;
        handleImageError: (url: string) => void;
        isVideoUrl: (url: string, contentType?: string | null) => boolean;
    };
}

export function ProductDetailsUI({ product, storePolicy, state, actions }: ProductDetailsUIProps) {
    const {
        selectedColor,
        selectedSize,
        averageRating,
        userRating,
        isSubmittingRating,
        hoverRating,
        mediaItems,
        safeSelectedIndex,
        selectedOptions,
        FALLBACK_PRODUCT_IMAGE
    } = state;

    const {
        setSelectedMediaIndex,
        setSelectedColor,
        setSelectedSize,
        setHoverRating,
        handleSubmitRating,
        handleImageError,
        isVideoUrl
    } = actions;
    
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const width = container.offsetWidth;
        const newIndex = Math.round(scrollLeft / width);
        if (newIndex !== safeSelectedIndex) {
            setSelectedMediaIndex(newIndex);
        }
    };

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

    const variantOptions = (product as any).variants?.enabled ? (product as any).variants.options ?? [] : [];
    const colorOption = variantOptions.find((option: any) => option.type === "color");
    const sizeOption = variantOptions.find((option: any) => option.type === "size");
    const colorValues = colorOption?.values?.filter(Boolean) ?? [];
    const sizeValues = sizeOption?.values?.filter(Boolean) ?? [];
    const hasColorOptions = colorValues.length > 0;
    const hasSizeOptions = sizeValues.length > 0;

    const shouldUnoptimize = (url: string) => {
        return url.includes(".ufs.sh") ||
            url.includes("utfs.io") ||
            url.includes(".cdninstagram.com") ||
            url.includes(".fbcdn.net");
    };

    return (
        <div className="min-h-screen bg-white pb-16" suppressHydrationWarning>
            <div className="max-w-[1520px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)] gap-6 lg:gap-10 xl:gap-14 px-4 sm:px-6 lg:px-12 pt-0 lg:pt-0 -mt-4">
                {/* Left: Gallery */}
                <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start lg:h-max">
                    <div className="relative group/gallery">
                        <div 
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="lg:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
                        >
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
                                                className="h-full w-full object-cover bg-neutral-100"
                                                muted
                                                loop
                                                playsInline
                                                autoPlay
                                                preload="metadata"
                                            />
                                        ) : (
                                            <Image
                                                src={media.url}
                                                alt={`${product.name} ${index + 1}`}
                                                fill
                                                className="object-cover bg-neutral-100 border-none"
                                                priority={index === 0}
                                                unoptimized={shouldUnoptimize(media.url)}
                                                onError={() => handleImageError(media.url)}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Mobile Image Indicator (Short Lines) */}
                        {mediaItems.length > 1 && (
                            <div className="lg:hidden flex justify-center gap-1.5 py-4 mb-2">
                                {mediaItems.map((_, index) => (
                                    <div 
                                        key={index}
                                        className={cn(
                                            "h-1 w-5 rounded-full transition-all duration-300",
                                            safeSelectedIndex === index ? "bg-primary w-8" : "bg-slate-200"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

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
                                            relative w-full aspect-3/4 transition-all duration-300 rounded-2xl overflow-hidden
                                            ${safeSelectedIndex === index
                                                ? "opacity-100"
                                                : "opacity-60 hover:opacity-100"
                                            }
                                        `}
                                    >
                                        {isVideo ? (
                                            <video
                                                src={media.url}
                                                className="h-full w-full object-cover bg-neutral-100"
                                                muted
                                                loop
                                                playsInline
                                                autoPlay
                                                preload="metadata"
                                            />
                                        ) : (
                                            <Image
                                                src={media.url}
                                                alt={`View ${index + 1}`}
                                                fill
                                                className="object-cover rounded-2xl"
                                                unoptimized={shouldUnoptimize(media.url)}
                                                onError={() => handleImageError(media.url)}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1 relative bg-neutral-100 overflow-hidden h-full rounded-3xl">
                            {currentIsVideo ? (
                                <video
                                    src={currentMedia.url}
                                    poster={posterFallback !== FALLBACK_PRODUCT_IMAGE ? posterFallback : undefined}
                                    className="h-full w-full object-cover bg-neutral-100"
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                    preload="metadata"
                                />
                            ) : (
                                <Image
                                    src={currentMedia.url}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 60vw"
                                    className="object-cover object-center bg-neutral-100"
                                    priority
                                    unoptimized={shouldUnoptimize(currentMedia.url)}
                                    onError={() => handleImageError(currentMedia.url)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-col pt-2 lg:max-w-[520px] lg:justify-self-end lg:pt-2 xl:max-w-[560px]">
                    <div className="space-y-3 pb-5 sm:space-y-3.5 sm:pb-6">
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

                        <div className="flex items-center gap-3 pt-1">
                            <div className="flex items-center gap-0.5">
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
                                            className="p-0.5 transition-transform duration-150 hover:-translate-y-0.5 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:opacity-50"
                                            aria-label={`Rate ${idx + 1} stars`}
                                        >
                                            <HugeiconsIcon
                                                icon={FavouriteIcon}
                                                size={16}
                                                className={filled ? "fill-red-500 text-red-500" : "text-neutral-300"}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                                <span className="font-semibold text-neutral-900">
                                    {Number.isFinite(averageRating) && averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {hasSizeOptions ? (
                        <div className="mt-6 space-y-2.5 pb-1">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold text-neutral-950">Size</span>
                                {selectedSize ? <span className="text-neutral-500">{selectedSize}</span> : null}
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {sizeValues.map((value: string) => {
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
                                {selectedColor ? <span className="text-sm text-neutral-700">{getColorName(selectedColor)}</span> : null}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {colorValues.map((value: string) => {
                                    const isActive = selectedColor === value;
                                    // Use the value directly if it's a hex, otherwise normalize it
                                    // If it's Name:Hex format, extract the Hex part
                                    const cssColor = value.includes(":") ? (value.split(":")[1] || "#000000") : 
                                                    (value.startsWith("#") ? value : value.toLowerCase().replace(/\s+/g, ''));
                                    const isWhiteLike = cssColor === 'white' || cssColor === '#fff' || cssColor === '#ffffff';

                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setSelectedColor(value)}
                                            className={cn(
                                                "relative size-6 rounded-full border transition-all hover:scale-110 active:scale-95 shadow-sm p-0",
                                                isActive ? "ring-2 ring-offset-2" : "border-neutral-200 hover:border-neutral-300"
                                            )}
                                            style={{
                                                backgroundColor: cssColor,
                                                borderColor: isActive ? cssColor : (isWhiteLike ? "#e5e5e5" : "transparent"),
                                                boxShadow: isActive ? `0 0 0 2px white, 0 0 0 4px ${cssColor}` : undefined,
                                            } as React.CSSProperties}
                                            title={value}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    <div className={`mt-6 ${hasColorOptions || hasSizeOptions ? "" : "border-t border-neutral-100 pt-6"}`}>
                        <div className="mb-6 w-full">
                            <ProductActions product={product as any} selectedOptions={selectedOptions} />
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
