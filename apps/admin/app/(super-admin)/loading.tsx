import { Skeleton } from "@shopvendly/ui/components/skeleton";
import { Card, CardContent, CardHeader } from "@shopvendly/ui/components/card";

export default function Loading() {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-[180px]" />
        </div>

        {/* KPI Stats Skeleton */}
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
        <div className="grid gap-5 md:grid-cols-7">
          <Card className="md:col-span-4 border-border/70 shadow-sm">
            <CardHeader className="pb-4 bg-muted/5 border-b border-border/40 mb-4">
                <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="p-6">
              <Skeleton className="h-[260px] md:h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="md:col-span-3 border-border/70 shadow-sm">
            <CardHeader className="pb-4 bg-muted/5 border-b border-border/40 mb-4">
                <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="p-6">
              <Skeleton className="h-[260px] md:h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Top Stores Skeleton */}
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="border-border/70 shadow-sm overflow-hidden">
              <CardHeader className="pb-4 bg-muted/5 border-b border-border/40">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-32" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-4 p-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-1.5 w-full rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
}
