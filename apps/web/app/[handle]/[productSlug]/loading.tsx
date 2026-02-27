export default function Loading() {
    return (
        <div className="min-h-screen bg-white pb-24 pt-28 md:pt-32">
            <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[1.8fr_1fr] gap-8 lg:gap-14 xl:gap-20 px-4 sm:px-6 lg:px-10 pt-8 lg:pt-14">

                {/* Left: Gallery Skeleton */}
                <div className="flex flex-col gap-4">
                    {/* Mobile carousel skeleton */}
                    <div className="lg:hidden flex gap-3 overflow-x-hidden pb-2">
                        <div className="w-[85vw] sm:w-[70vw] shrink-0 bg-neutral-100 animate-pulse aspect-3/4 min-h-[320px]" style={{ aspectRatio: "3 / 4" }} />
                        <div className="w-[85vw] sm:w-[70vw] shrink-0 bg-neutral-100 animate-pulse aspect-3/4 min-h-[320px]" style={{ aspectRatio: "3 / 4" }} />
                    </div>

                    {/* Desktop thumbs + main skeleton */}
                    <div className="hidden lg:flex flex-row gap-6 lg:gap-8 h-[75vh] min-h-[600px] max-h-[900px]">
                        <div className="flex flex-col gap-4 w-20 xl:w-24 shrink-0">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-full aspect-3/4 bg-neutral-100 animate-pulse" />
                            ))}
                        </div>
                        <div className="flex-1 bg-neutral-100 animate-pulse h-full" />
                    </div>
                </div>

                {/* Right: Product Details Skeleton */}
                <div className="flex flex-col pt-6 lg:pt-0 lg:pl-6 max-w-xl w-full">

                    {/* Store Info - Header skeleton */}
                    <div className="flex items-start justify-between mb-8 gap-4 pb-6 border-b border-neutral-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-100 animate-pulse" />
                            <div className="h-4 w-24 bg-neutral-100 animate-pulse rounded" />
                        </div>
                        <div className="w-16 h-4 bg-neutral-100 animate-pulse rounded" />
                    </div>

                    {/* Product Name & Price Module skeleton */}
                    <div className="mb-10 flex flex-col gap-4">
                        <div className="h-10 w-3/4 bg-neutral-100 animate-pulse rounded" />
                        <div className="h-10 w-1/2 bg-neutral-100 animate-pulse rounded" />
                        <div className="h-6 w-32 bg-neutral-100 animate-pulse rounded mt-2" />
                    </div>

                    {/* Style Section skeleton */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-4 w-12 bg-neutral-100 animate-pulse rounded" />
                            <div className="h-4 w-20 bg-neutral-100 animate-pulse rounded" />
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="h-12 w-full bg-neutral-100 animate-pulse" />
                            ))}
                        </div>
                    </div>

                    {/* Actions skeleton */}
                    <div className="mb-12 flex flex-col gap-3">
                        <div className="h-14 w-full bg-neutral-100 animate-pulse rounded-full" />
                        <div className="h-14 w-full bg-neutral-100 animate-pulse rounded-full" />
                    </div>

                    {/* Description skeleton */}
                    <div className="pt-8 border-t border-neutral-100 flex flex-col gap-3">
                        <div className="h-4 w-32 bg-neutral-100 animate-pulse rounded mb-2" />
                        <div className="h-4 w-full bg-neutral-100 animate-pulse rounded" />
                        <div className="h-4 w-full bg-neutral-100 animate-pulse rounded" />
                        <div className="h-4 w-2/3 bg-neutral-100 animate-pulse rounded" />
                    </div>

                </div>
            </div>
        </div>
    );
}
