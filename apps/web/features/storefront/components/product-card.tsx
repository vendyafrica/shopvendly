"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { getStorefrontUrl } from "@/utils/misc";
import { isLikelyVideoMedia } from "@/utils/misc";

interface ProductCardProps {
  title: string;
  slug: string;
  price: string;
  image: string | null;
  contentType?: string | null;
  index?: number;
  storeSlug?: string;
}

const FALLBACK_PRODUCT_IMAGE = "https://cdn.cosmos.so/25e7ef9d-3d95-486d-b7db-f0d19c1992d7?format=jpeg";

// More subtle aspect ratio variations
const aspectVariants = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[1/1]",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[5/6]",
];

export function ProductCard({ title, slug, price, image, contentType, index = 0, storeSlug }: ProductCardProps) {
  const params = useParams();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [forceVideo, setForceVideo] = useState(false);

  const paramsObject = typeof params === "object" ? (params as Record<string, string | undefined>) : {};
  const derivedStoreSlug = storeSlug ?? paramsObject.handle ?? paramsObject.s;
  const currentStoreSlug = derivedStoreSlug ?? "";
  const aspectClass = aspectVariants[index % aspectVariants.length];

  const imageUrl = image || FALLBACK_PRODUCT_IMAGE;

  const isVideo = forceVideo || isLikelyVideoMedia({ url: imageUrl, contentType });

  const prefetchedHref = derivedStoreSlug ? getStorefrontUrl(derivedStoreSlug, `/${slug}`) : `/${slug}`;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isNavigating) {
      event.preventDefault();
      return;
    }
    setIsNavigating(true);
    // Best-effort prefetch to reduce perceived delay
    try {
      if (derivedStoreSlug) {
        router.prefetch(prefetchedHref);
      }
    } catch {
      // Prefetch is best-effort; ignore errors
    }
  };

  return (
    <Link
      href={prefetchedHref}
      onClick={handleClick}
      className={`group block break-inside-avoid mb-3 sm:mb-4 lg:mb-5 ${isNavigating ? "pointer-events-none opacity-70" : ""}`}
      aria-busy={isNavigating}
    >
      {/* Image Container */}
      <div className={`relative overflow-hidden rounded-lg ${aspectClass} bg-muted`}>
        {isVideo ? (
          <video
            src={imageUrl}
            poster={FALLBACK_PRODUCT_IMAGE}
            className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]"
            muted
            playsInline
            loop
            autoPlay
          />
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority={index < 4}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]"
            unoptimized={imageUrl.includes(".ufs.sh") || imageUrl.includes("utfs.io")}
            onError={() => setForceVideo(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

        {isNavigating && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" aria-label="Loading" />
          </div>
        )}
      </div>

      {/* Product Info - Clean and minimal */}
      <div className="mt-2 px-0.5 sm:px-0.5">
        <h3 className="text-[13px] sm:text-sm font-normal text-foreground leading-tight line-clamp-2 mb-1">
          {title}
        </h3>
        <p className="text-xs sm:text-[13px] font-medium text-muted-foreground">
          {price}
        </p>
      </div>
    </Link>
  );
}
