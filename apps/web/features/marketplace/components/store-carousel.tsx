"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNavigation,
  CarouselIndicator,
} from "@shopvendly/ui/components/carousel";
import { cn } from "@shopvendly/ui/lib/utils";

interface StoreCarouselProps {
  images: string[];
  className?: string;
}

export function StoreCarousel({ images, className }: StoreCarouselProps) {
  return (
    <div className={cn("relative group", className)}>
      <Carousel>
        <CarouselContent className="h-full">
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={image}
                  alt={`Product ${index + 1}`}
                  fill
                  draggable={false}
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation arrows — hover only */}
        {images.length > 1 && (
          <CarouselNavigation
            className="z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            classNameButton={cn(
              "cursor-pointer hover:cursor-pointer",
              "bg-white/90 hover:bg-white",
              "shadow-md",
              "pointer-events-auto"
            )}
          />
        )}

        {/* Indicators */}
        {images.length > 1 && (
          <CarouselIndicator className="pb-3" />
        )}
      </Carousel>
    </div>
  );
}
