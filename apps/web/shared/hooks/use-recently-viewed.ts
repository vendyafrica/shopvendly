"use client";

import { useState, useEffect, useCallback } from "react";

export interface RecentItem {
    id: string;
    name: string;
    price: number;
    currency: string;
    image: string;
    contentType?: string;
    store: {
        name: string;
        slug: string;
    };
    slug: string;
    viewedAt: number;
}

const MAX_RECENT_ITEMS = 20;
const STORAGE_KEY = "vendly_recent_items";
const RECENT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function isValidRecentItem(item: unknown): item is RecentItem {
    if (!item || typeof item !== "object") return false;
    const i = item as Record<string, unknown>;
    const store = i.store as Record<string, unknown> | undefined;

    return (
        typeof i.id === "string" &&
        typeof i.name === "string" &&
        typeof i.price === "number" &&
        typeof i.currency === "string" &&
        typeof i.image === "string" &&
        typeof i.slug === "string" &&
        typeof i.viewedAt === "number" &&
        !!store &&
        typeof store.name === "string" &&
        typeof store.slug === "string"
    );
}

function sanitizeRecentItems(items: unknown, now = Date.now()): RecentItem[] {
    if (!Array.isArray(items)) return [];

    const seen = new Set<string>();
    const cleaned: RecentItem[] = [];

    for (const raw of items) {
        if (!isValidRecentItem(raw)) continue;
        if (now - raw.viewedAt > RECENT_TTL_MS) continue;
        if (seen.has(raw.id)) continue;
        seen.add(raw.id);
        cleaned.push(raw);
    }

    cleaned.sort((a, b) => b.viewedAt - a.viewedAt);
    return cleaned.slice(0, MAX_RECENT_ITEMS);
}

export function useRecentlyViewed() {
    const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load items on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                const cleaned = sanitizeRecentItems(parsed);
                setRecentItems(cleaned);

                if (cleaned.length !== (Array.isArray(parsed) ? parsed.length : 0)) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
                }
            }
        } catch (error) {
            console.error("Failed to load recently viewed items", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const addToRecentlyViewed = useCallback((item: Omit<RecentItem, "viewedAt">) => {
        setRecentItems((prev) => {
            const newItem = { ...item, viewedAt: Date.now() };
            // Remove existing item if it exists (to move it to top)
            const filtered = prev.filter((i) => i.id !== newItem.id);
            // Add new item to front
            const updated = sanitizeRecentItems([newItem, ...filtered]);

            // Persist to storage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (error) {
                console.error("Failed to save recently viewed item", error);
            }

            return updated;
        });
    }, []);

    const clearRecentlyViewed = useCallback(() => {
        setRecentItems([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        recentItems,
        addToRecentlyViewed,
        clearRecentlyViewed,
        isLoaded
    };
}
