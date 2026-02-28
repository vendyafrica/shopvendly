"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
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
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
            <CarouselPrevious className="pointer-events-auto bg-white/90 hover:bg-white shadow-md" />
            <CarouselNext className="pointer-events-auto bg-white/90 hover:bg-white shadow-md" />
          </div>
        )}
      </Carousel>
    </div>
  );
}
