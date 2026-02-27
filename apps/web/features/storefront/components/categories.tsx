"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from 'next/link';
import { StorefrontSearch } from "./storefront-search";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

interface Category {
    slug: string;
    name: string;
    image: string | null;
}

const API_BASE = ""; 

export function Categories() {
    const params = useParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            const slug = params?.s as string;

            if (!slug) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/storefront/${slug}/categories`);
                if (res.ok) {
                    setCategories(await res.json());
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [params?.s]);

    if (loading) {
        return (
            <nav className="border-b border-border bg-background">
                <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
                    <div className="flex gap-8 overflow-x-auto scrollbar-hide py-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-5 w-20 bg-muted rounded animate-pulse shrink-0" />
                        ))}
                    </div>
                </div>
            </nav>
        );
    }

    if (categories.length === 0) return null;

    return (
        <nav id="storefront-categories-rail" className="border-b border-border bg-background sticky top-0 z-10">
            <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
                <div className="flex items-center gap-4 sm:gap-6 py-1">
                    <div className="flex-1 overflow-x-auto scrollbar-hide">
                        <div className="flex gap-6 sm:gap-8 min-w-max">
                            {/* All/Featured link */}
                            <Link
                                href={`/${params?.s}`}
                                onClick={() => setActiveCategory("all")}
                                className={`
                                    shrink-0 py-4 text-sm font-medium transition-colors relative
                                    ${activeCategory === "all"
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    }
                                `}
                            >
                                Featured
                                {activeCategory === "all" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                                )}
                            </Link>

                            {/* Category links */}
                            {categories.map((category) => (
                                <Link
                                    key={category.slug}
                                    href={`/${params?.s}/categories/${category.slug}`}
                                    onClick={() => setActiveCategory(category.slug)}
                                    className={`
                                        shrink-0 py-4 text-sm font-medium transition-colors relative whitespace-nowrap
                                        ${activeCategory === category.slug
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                        }
                                    `}
                                >
                                    {category.name}
                                    {activeCategory === category.slug && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Desktop search */}
                    <div className="hidden sm:flex items-center min-w-[260px] max-w-[340px]">
                        <StorefrontSearch
                            storeSlug={params?.s as string}
                            isHomePage={false}
                        />
                    </div>

                    {/* Mobile search toggle */}
                    <button
                        className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
                        onClick={() => setIsSearchOpen((v) => !v)}
                        aria-label="Toggle search"
                    >
                        <HugeiconsIcon icon={Search01Icon} size={18} className="text-foreground" />
                    </button>

                    {isSearchOpen && (
                        <div className="sm:hidden pb-3">
                            <StorefrontSearch
                                storeSlug={params?.s as string}
                                isHomePage={false}
                                onSubmitted={() => setIsSearchOpen(false)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}