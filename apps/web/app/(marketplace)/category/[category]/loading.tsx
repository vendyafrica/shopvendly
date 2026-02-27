import { SkeletonBuilder } from "@/components/ui/skeleton-builder";

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Category title skeleton */}
        <SkeletonBuilder type="category-title" />
        
        {/* Marketplace grid skeleton */}
        <SkeletonBuilder type="store-grid" />
      </div>
    </div>
  );
}
