"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { getStorefrontUrl } from "@/utils/misc";
import { isLikelyVideoMedia } from "@/utils/misc";

interface ProductCardProps {
  title: string;
  slug: string;
  price: string;
  originalPrice?: string | null;
  discountPercent?: number | null;
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
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[5/6]",
];

export function ProductCard({ title, slug, price, originalPrice, discountPercent, image, contentType, index = 0, storeSlug }: ProductCardProps) {
  const params = useParams();
  const [imageError, setImageError] = useState(false);

  const paramsObject = typeof params === "object" ? (params as Record<string, string | undefined>) : {};
  const derivedStoreSlug = storeSlug ?? paramsObject.handle ?? paramsObject.s;
  const aspectClass = aspectVariants[index % aspectVariants.length];

  const originalImageUrl = image || FALLBACK_PRODUCT_IMAGE;
  const currentImageUrl = imageError ? FALLBACK_PRODUCT_IMAGE : originalImageUrl;

  const isVideo = !imageError && isLikelyVideoMedia({ url: currentImageUrl, contentType });

  const prefetchedHref = derivedStoreSlug ? getStorefrontUrl(derivedStoreSlug, `/${slug}`) : `/${slug}`;

  return (
    <Link
      href={prefetchedHref}
      className="group block break-inside-avoid mb-6 sm:mb-7 transition-transform duration-300 hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className={`relative overflow-hidden rounded-md ${aspectClass} bg-neutral-100`}>
        {isVideo ? (
          <video
            src={currentImageUrl}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
            muted
            playsInline
            loop
            preload="metadata"
            onError={() => setImageError(true)}
          />
        ) : currentImageUrl ? (
          <Image
            src={currentImageUrl}
            alt={title}
            fill
            priority={index < 4}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
            unoptimized={currentImageUrl.includes(".ufs.sh") || currentImageUrl.includes("utfs.io") || currentImageUrl.includes(".cdninstagram.com") || currentImageUrl.includes(".fbcdn.net")}
            onError={() => !imageError && setImageError(true)}
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

        {/* Floating price pill */}
        <div className="pointer-events-none absolute left-3 top-3 inline-flex flex-col rounded-2xl bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-gray-900 shadow-md backdrop-blur">
          <span>{price}</span>
          {originalPrice && discountPercent ? (
            <span className="text-[10px] font-medium uppercase text-red-500">{discountPercent}% off</span>
          ) : null}
        </div>

      </div>
      <p className="mt-2 text-sm font-semibold leading-tight text-neutral-900 capitalize">
        {title}
      </p>
    </Link>
  );
}
