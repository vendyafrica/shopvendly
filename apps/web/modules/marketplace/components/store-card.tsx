"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { MarketplaceStore } from "@/modules/marketplace";
import { getStorefrontUrl } from "@/utils/misc";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@shopvendly/ui/components/carousel";
import { StoreAvatarSimple } from "@/components/store-avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon } from "@hugeicons/core-free-icons";
import { Bricolage_Grotesque } from "next/font/google";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

interface StoreCardProps {
  store: MarketplaceStore;
}

const FALLBACK_STORE_IMAGE = "https://cdn.cosmos.so/974817a0-84de-4604-95c9-93db9b929ea9?format=jpeg";

const capitalizeFirstLetter = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

function isVideo(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  return contentType.startsWith("video/");
}

function MediaItem({ url, alt, isVideoMedia, priority }: {
  url: string;
  alt: string;
  isVideoMedia: boolean;
  priority?: boolean;
}) {
  if (isVideoMedia) {
    return (
      <video
        src={url}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <Image
      src={url}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 50vw, 33vw"
      priority={priority}
      unoptimized
    />
  );
}

export function StoreCard({ store }: StoreCardProps) {
  const router = useRouter();

  // Prefer mediaItems (has content type) over plain images array
  const rawMediaItems = store.mediaItems && store.mediaItems.length > 0
    ? store.mediaItems.filter((m) => m.url && m.url.trim() !== "")
    : (store.images || [])
        .filter((src): src is string => typeof src === "string" && src.trim() !== "" && (src.startsWith("http") || src.startsWith("/")))
        .map((url) => ({ url, contentType: null as string | null }));

  const mediaItems = rawMediaItems.length > 0
    ? rawMediaItems
    : [{ url: FALLBACK_STORE_IMAGE, contentType: "image/jpeg" as string | null }];

  const rating = 4.8;

  return (
    <div
      className="group cursor-pointer"
      onClick={() => router.push(getStorefrontUrl(store.slug))}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(getStorefrontUrl(store.slug));
        }
      }}
      role="link"
      tabIndex={0}
    >
      <div className="relative">
        <Carousel className="w-full overflow-hidden rounded-2xl shadow-sm transition-all duration-300 group-hover:shadow-lg active:scale-[0.97]">
          <CarouselContent className="cursor-pointer">
            {mediaItems.map((item, idx) => (
              <CarouselItem key={`${item.url}-${idx}`}>
                <div className="relative aspect-square w-full">
                  <MediaItem
                    url={item.url}
                    alt={`${store.name} hero ${idx + 1}`}
                    isVideoMedia={isVideo(item.contentType)}
                    priority={idx === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <CarouselPrevious className="pointer-events-auto" />
            <CarouselNext className="pointer-events-auto" />
          </div>
        </Carousel>

        {/* Floating Rating Badge in Top Right */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 bg-black/20 py-1 rounded-full">
          <span className="text-[10px] font-bold text-white">{rating}</span>
          <HugeiconsIcon icon={StarIcon} size={10} className="text-yellow-500 fill-yellow-500" />
        </div>
      </div>

      <div className="flex items-center mt-3 px-0.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <StoreAvatarSimple
            storeName={store.name}
            logoUrl={store.logoUrl}
            instagramAvatarUrl={store.instagramAvatarUrl}
            size={32}
            className="shrink-0"
          />
          <span
            className={`${bricolageGrotesque.className} text-sm font-medium text-foreground leading-tight group-hover:text-foreground/80 transition-colors truncate`}
          >
            {capitalizeFirstLetter(store.name)}
          </span>
        </div>
      </div>
    </div>
  );
}
