"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store04Icon, Cursor02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@shopvendly/ui/components/button";

export default function SuccessPage() {
    const [storeSlug, setStoreSlug] = useState("");
    const [storeUrl, setStoreUrl] = useState("#");

    useEffect(() => {
        const storedSlug = localStorage.getItem("vendly_store_slug") || "";
        const storedUrl = localStorage.getItem("vendly_storefront_url") || "";
        setStoreSlug(storedSlug);
        setStoreUrl(storedUrl || "#");
    }, []);

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "shopvendly.store";
    const displayUrl = storeSlug ? `${storeSlug}.${rootDomain}` : "";

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center bg-white px-4 text-center">
            <div className="mb-8">
                <HugeiconsIcon icon={Store04Icon} className="h-8 w-8 text-primary" />
            </div>

            <p className="text-lg mb-4 max-w-2xl">
                Your new store is ready and live.<br />You can share this link with your customers.
            </p>

            <div className="p-8 w-full max-w-xl">
                <p className="text-lg text-gray-800 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <span className="font-semibold text-gray-500 text-sm tracking-widest">Your Store Link:</span>
                    <a
                        href={storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium border-b-2 border-blue-200 border-dashed hover:text-primary hover:border-primary hover:border-solid transition-all duration-300 text-xl"
                    >
                        {displayUrl}
                    </a>
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link href={storeSlug ? `/admin/${storeSlug}` : "/admin"}>
                    <Button size="lg">
                        Go to Admin <HugeiconsIcon icon={Cursor02Icon} className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
