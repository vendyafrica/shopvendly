export default function Loading() {
    return (
        <div className="min-h-screen bg-white pt-20 pb-24 animate-pulse">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
                <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-6 lg:p-8 space-y-8">
                    <div className="h-6 w-32 bg-neutral-100 rounded" />
                    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
                        <div className="space-y-6">
                            <div className="h-40 bg-neutral-50 rounded-2xl" />
                            <div className="h-40 bg-neutral-50 rounded-2xl" />
                        </div>
                        <div className="h-64 bg-neutral-50 rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
