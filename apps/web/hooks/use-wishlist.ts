"use client";

import { useEffect, useState, useCallback } from "react";

export interface WishlistItem {
    id: string;
    name: string;
    price: number;
    currency: string;
    image?: string;
    contentType?: string;
    slug?: string;
    store?: {
        id?: string;
        name?: string;
        slug?: string;
    };
}

const STORAGE_KEY = "vendly_wishlist";

function isValid(item: unknown): item is WishlistItem {
    if (!item || typeof item !== "object") return false;
    const i = item as Record<string, unknown>;
    const store = i.store as Record<string, unknown> | undefined;
    return (
        typeof i.id === "string" &&
        typeof i.name === "string" &&
        typeof i.price === "number" &&
        typeof i.currency === "string" &&
        (i.image === undefined || typeof i.image === "string") &&
        (i.slug === undefined || typeof i.slug === "string") &&
        (!store || typeof store.slug === "string" || store.slug === undefined)
    );
}

function loadWishlist(): WishlistItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isValid);
    } catch {
        return [];
    }
}

function persistWishlist(items: WishlistItem[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useWishlist() {
    const [items, setItems] = useState<WishlistItem[]>(() => loadWishlist());

    useEffect(() => {
        if (items) {
            persistWishlist(items);
        }
    }, [items]);

    const isInWishlist = useCallback((id: string) => items.some((item) => item.id === id), [items]);

    const toggleWishlist = useCallback((item: WishlistItem) => {
        setItems((prev) => {
            const exists = prev.some((i) => i.id === item.id);
            if (exists) {
                return prev.filter((i) => i.id !== item.id);
            }
            return [...prev, item];
        });
    }, []);

    const removeFromWishlist = useCallback((id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    }, []);

    const clearWishlist = useCallback(() => {
        setItems([]);
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    return { items, isInWishlist, toggleWishlist, removeFromWishlist, clearWishlist };
}
