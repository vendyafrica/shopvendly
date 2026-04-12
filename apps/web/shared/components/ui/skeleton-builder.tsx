import { StoreImageSkeleton, StoreInfoSkeleton } from "./skeleton-parts";

interface SkeletonBuilderProps {
    type: "category-title" | "store-grid";
}

export function SkeletonBuilder({ type }: SkeletonBuilderProps) {
    if (type === "category-title") {
        return (
            <div className="mb-8">
                <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="h-4 w-96 bg-gray-200 animate-pulse rounded" />
            </div>
        );
    }

    if (type === "store-grid") {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <StoreImageSkeleton />
                        <StoreInfoSkeleton />
                    </div>
                ))}
            </div>
        );
    }

    return null;
}
