import { Skeleton } from "@shopvendly/ui/components/skeleton";

/**
 * Full-page skeleton for the Products admin page
 */
export function ProductsPageSkeleton() {
    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card p-3 space-y-3">
                {/* Table header */}
                <div className="flex items-center gap-4 border-b pb-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20 ml-auto" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>
                {/* Table rows */}
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 py-3">
                        <Skeleton className="size-10 rounded-md shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="size-8 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Full-page skeleton for the admin page
 */
export function AdminPageSkeleton() {
    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="size-8 rounded" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Revenue Chart */}
                <div className="rounded-lg border bg-card p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                    <Skeleton className="h-[200px] w-full rounded" />
                </div>
                {/* Top Products */}
                <div className="rounded-lg border bg-card p-4 space-y-4">
                    <Skeleton className="h-5 w-40" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="size-10 rounded" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-8 w-20" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4 py-2">
                            <Skeleton className="size-10 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Full-page skeleton for the Orders/Transactions page
 */
export function OrdersPageSkeleton() {
    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-40" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-48" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-7 w-16" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card overflow-hidden">
                {/* Table header */}
                <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20 ml-auto" />
                    <Skeleton className="h-4 w-16" />
                </div>
                {/* Table rows */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                        <Skeleton className="h-4 w-20" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="size-8 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Full-page skeleton for the Customers page
 */
export function CustomersPageSkeleton() {
    return (
        <div className="flex-1 space-y-4 px-4 py-4 md:px-8 md:py-6">
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-64 hidden md:block" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden items-center bg-muted/40 rounded-lg p-0.5 border border-border/40 md:flex">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                        <Skeleton className="h-8 w-32" />
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-white px-6 py-4 shadow-sm">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Table Content */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
                <div className="flex flex-col gap-3 p-2 sm:flex-row sm:items-center justify-between border-b border-border/40 bg-muted/5">
                    <div className="flex items-center gap-2 px-1">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-8 w-16 rounded-lg" />
                        ))}
                    </div>
                    <div className="px-1">
                        <Skeleton className="h-9 w-full sm:w-72 rounded-lg" />
                    </div>
                </div>
                
                <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-4 py-2 border-b border-border/40 last:border-0">
                            <Skeleton className="size-8 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-4 w-20 hidden md:block" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="size-8 rounded ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton for a generic data table
 */
export function DataTableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 rounded-lg border border-dashed border-border/60 p-3 bg-muted/30"
                >
                    <Skeleton className="size-10 rounded-md shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16 shrink-0" />
                    <Skeleton className="h-6 w-20 shrink-0" />
                    <Skeleton className="size-8 shrink-0" />
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton for a card grid (e.g., store cards)
 */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: cards }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}
