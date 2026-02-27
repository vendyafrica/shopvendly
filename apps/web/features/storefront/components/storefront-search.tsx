"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@shopvendly/ui/components/input";

interface StorefrontSearchProps {
    storeSlug: string;
    isHomePage?: boolean;
    onSubmitted?: () => void;
}

export function StorefrontSearch({ storeSlug, isHomePage, onSubmitted }: StorefrontSearchProps) {
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
        router.push(`/?${params.toString()}`);
        onSubmitted?.();
    };

    const surface = isHomePage
        ? "bg-transparent border-white/35 text-white placeholder:text-white/70"
        : "bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400";

    return (
        <form onSubmit={submit} className="w-full">
            <div className={`relative flex items-center h-9 rounded-full border px-4 gap-2 transition-colors ${surface}`}>
                <HugeiconsIcon icon={Search01Icon} size={18} className={isHomePage ? "text-white/80" : "text-neutral-500"} />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onBlur={() => submit()}
                    placeholder="Search this store"
                    className={`h-full border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:outline-none ${isHomePage ? "text-white" : "text-neutral-900"}`}
                />
            </div>
        </form>
    );
}
