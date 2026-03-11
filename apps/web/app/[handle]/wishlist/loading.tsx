export default function Loading() {
    return (
        <div className="min-h-screen bg-white pt-24 pb-24 animate-pulse">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24 space-y-8">
                <div className="h-10 w-48 bg-neutral-100 rounded-md" />
                <div className="grid lg:grid-cols-[1fr_320px] gap-8">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 w-full bg-neutral-50 rounded-2xl border border-neutral-100" />
                        ))}
                    </div>
                    <div className="h-64 w-full bg-neutral-50 rounded-2xl border border-neutral-100" />
                </div>
            </div>
        </div>
    );
}
