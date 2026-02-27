"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { MarketplaceStore } from "@/types/marketplace";
import { getStorefrontUrl } from "@/utils/misc";
import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselItem,
  CarouselNavigation,
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

const FALLBACK_STORE_IMAGE = "https://cdn.cosmos.so/64986e58-da40-41e5-b0e2-1d041230c287?format=jpeg";

// Helper function to capitalize only the first letter
const capitalizeFirstLetter = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function StoreCard({ store }: StoreCardProps) {
  const router = useRouter();
  const carouselImages = store.images && store.images.length > 0 ? store.images : [FALLBACK_STORE_IMAGE];

  // Mock rating - you can replace this with actual rating from store data
  const rating = 4.8;

  return (
    <div
      className="group cursor-pointer"
      onClick={() => {
        router.push(getStorefrontUrl(store.slug));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(getStorefrontUrl(store.slug));
        }
      }}
      role="link"
      tabIndex={0}
    >
      <div className="relative aspect-square">
        <Carousel className="h-full">
          <div className="h-full w-full overflow-hidden rounded-2xl shadow-sm transition-all duration-300 group-hover:shadow-lg active:scale-[0.97]">
            <CarouselContent className="h-full cursor-pointer">
              {carouselImages.map((src, idx) => (
                <CarouselItem key={`${src}-${idx}`} className="h-full">
                  <div className="relative h-full w-full">
                    <Image
                      src={src}
                      alt={`${store.name} hero ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      priority={idx === 0}
                      unoptimized={src.includes(".ufs.sh")}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <CarouselNavigation
              className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 cursor-pointer"
              classNameButton="bg-background/90 shadow-sm pointer-events-auto cursor-pointer"
            />
            <CarouselIndicator className="pb-3 cursor-pointer" />
          </div>
        </Carousel>
      </div>

      <div className="flex items-center justify-between mt-3 px-0.5">
        <div className="flex items-center gap-2.5">
          <StoreAvatarSimple
            storeName={store.name}
            logoUrl={store.logoUrl}
            instagramAvatarUrl={store.instagramAvatarUrl}
            size={32}
          />
          <span
            className={`${bricolageGrotesque.className} text-base font-normal text-foreground leading-tight group-hover:text-foreground/80 transition-colors`}
          >
            {capitalizeFirstLetter(store.name)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-foreground">{rating}</span>
          <HugeiconsIcon icon={StarIcon} size={16} className="text-foreground fill-foreground" />
        </div>
      </div>
    </div>
  );
}
