import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { bricolage as geistSans } from "@/utils/fonts";

export function CheckoutLoading() {
    return (
        <div className="min-h-screen bg-white pt-20 pb-24">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
                <div className="rounded-2xl border border-neutral-200 bg-white/90 shadow-sm p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
                    <div className="h-5 w-32 bg-neutral-100 rounded" />
                    <div className="grid lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
                        <div className="space-y-4">
                            {Array.from({ length: 2 }).map((_, idx) => (
                                <div key={idx} className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5 space-y-4">
                                    <div className="h-4 w-1/2 bg-neutral-200 rounded" />
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div className="h-11 bg-neutral-200 rounded-lg" />
                                        <div className="h-11 bg-neutral-200 rounded-lg" />
                                    </div>
                                    <div className="h-11 bg-neutral-200 rounded-lg" />
                                    <div className="h-11 bg-neutral-200 rounded-lg" />
                                </div>
                            ))}
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 space-y-4">
                            <div className="h-4 w-28 bg-neutral-200 rounded" />
                            <div className="h-16 bg-neutral-200 rounded" />
                            <div className="h-11 bg-neutral-200 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
