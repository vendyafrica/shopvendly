"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@shopvendly/ui/components/input";

interface StorefrontSearchProps {
    storeSlug: string;
    isOverlay?: boolean;
    onSubmitted?: () => void;
    placeholder?: string;
}

export function StorefrontSearch({
    storeSlug,
    isOverlay,
    onSubmitted,
    placeholder = "Search this store",
}: StorefrontSearchProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams?.get("q") || "");

    const submit = (e?: FormEvent) => {
        e?.preventDefault();
        const trimmed = query.trim();
        const params = new URLSearchParams(searchParams?.toString());
        if (trimmed) {
            params.set("q", trimmed);
        } else {
            params.delete("q");
        }
        const basePath = storeSlug ? `/${storeSlug}` : "/";
        const queryString = params.toString();
        router.push(queryString ? `${basePath}?${queryString}` : basePath);
        onSubmitted?.();
    };

    const surface = isOverlay
        ? "bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-within:bg-white/20"
        : "bg-neutral-100 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-within:bg-white focus-within:border-primary/30";

    return (
        <form onSubmit={submit} className="w-full">
            <div className={`relative flex items-center h-10 rounded-xl border px-3 gap-2 transition-all ${surface}`}>
                <HugeiconsIcon icon={Search01Icon} size={18} className={isOverlay ? "text-white/70" : "text-neutral-500"} />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className={`h-full border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:outline-none ${isOverlay ? "text-white" : "text-neutral-900"}`}
                />
            </div>
        </form>
    );
}
