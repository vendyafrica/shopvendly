import { Skeleton } from "@shopvendly/ui/components/skeleton";
import { Card, CardContent } from "@shopvendly/ui/components/card";

export default function Loading() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Stats Header */}
            <div>
                <Skeleton className="h-8 w-[180px] mb-2" />
            </div>

            {/* Stats Cards Skeleton (4 large ones) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} size="sm" className="bg-muted/20 border-border/40 shadow-none">
                        <CardContent className="pt-4 flex flex-col gap-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-3 w-40" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="md:col-span-4 border-border/70 shadow-sm">
                    <CardContent className="p-6">
                        <Skeleton className="h-8 w-[150px] mb-4" />
                        <Skeleton className="h-[260px] md:h-[320px] w-full" />
                    </CardContent>
                </Card>
                <Card className="md:col-span-3 border-border/70 shadow-sm">
                    <CardContent className="p-6">
                        <Skeleton className="h-8 w-[120px] mb-4" />
                        <Skeleton className="h-[260px] md:h-[320px] w-full" />
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-border/70 shadow-sm">
                        <CardContent className="p-6">
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-48 mb-4" />
                            <Skeleton className="h-8 w-40" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
