export function StoreImageSkeleton() {
    return <div className="h-48 w-full bg-gray-200 animate-pulse rounded-t-xl" />;
}

export function StoreInfoSkeleton() {
    return (
        <div className="p-4 space-y-3">
            <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
        </div>
    );
}
