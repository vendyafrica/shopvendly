import { Skeleton } from "@shopvendly/ui/components/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            {/* Header Button Skeleton */}
            <div className="flex items-end justify-end">
                <Skeleton className="h-10 w-[160px] rounded-md" />
            </div>

            {/* Category List Skeletons */}
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="border border-border/50 rounded-lg p-4 bg-card/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <Skeleton className="h-4 w-4 rounded" />
                                <Skeleton className="h-6 w-48" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-24 rounded-full" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
