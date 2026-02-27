"use client";

// =====================================
// Skeleton Components for Loading States
// =====================================

export function HeroSkeleton() {
    return (
        <section className="relative h-[85vh] w-full overflow-hidden">
            <div className="relative h-full w-full overflow-hidden rounded-b-[60px] md:rounded-b-[100px] bg-neutral-200 animate-pulse">
                {/* Centered title skeleton */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="h-24 md:h-40 w-64 md:w-96 bg-neutral-300 rounded-lg animate-pulse" />
                </div>

                {/* Bottom left info skeleton */}
                <div className="absolute bottom-10 left-6 md:left-12">
                    <div className="h-8 w-32 bg-neutral-300 rounded animate-pulse mb-2" />
                    <div className="h-4 w-24 bg-neutral-300 rounded animate-pulse" />
                </div>
            </div>
        </section>
    );
}

export function HeaderSkeleton() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12">
                <div className="flex items-center justify-between h-24">
                    <div className="h-8 w-24 bg-white/20 rounded animate-pulse" />
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-white/20 rounded-full animate-pulse" />
                        <div className="h-10 w-10 bg-white/20 rounded-full animate-pulse" />
                        <div className="h-10 w-10 bg-white/20 rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        </header>
    );
}

export function CategorySkeleton() {
    return (
        <div className="shrink-0">
            <div className="w-[320px] aspect-4/3 rounded-lg bg-neutral-200 animate-pulse" />
            <div className="mt-4 h-4 w-24 bg-neutral-200 rounded animate-pulse" />
        </div>
    );
}

export function CategoriesSkeleton() {
    return (
        <section className="py-12 bg-[#F9F9F7]">
            <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse mb-6 mx-8" />
            <div className="w-full px-8">
                <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4">
                    {[1, 2, 3, 4].map((i) => (
                        <CategorySkeleton key={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="break-inside-avoid mb-4 md:mb-5">
            <div className="aspect-3/4 rounded-lg bg-neutral-200 animate-pulse" />
            <div className="mt-3 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-neutral-200 rounded w-1/2 animate-pulse" />
            </div>
        </div>
    );
}

export function ProductGridSkeleton() {
    return (
        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-5 px-3 sm:px-4 lg:px-6 [column-fill:balance]">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}
